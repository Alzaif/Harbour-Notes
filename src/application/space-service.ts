import { randomUUID } from 'node:crypto';
import type { User } from '../domain/entities/user.js';
import type { Space, SpaceMemberRole, CreateSpaceParams } from '../domain/entities/space.js';
import type { PageRef } from '../domain/entities/page-content.js';
import type { SpaceRegistryPort } from '../domain/ports/space-registry.port.js';
import type { GitRepositoryPort } from '../domain/ports/git-repository.port.js';
import type { SpaceManifestPort } from '../domain/ports/space-manifest.port.js';
import type { PublishService } from './publish-service.js';
import type { MonorepoGitAdapter } from '../infrastructure/git/monorepo-git-adapter.js';
import { ForbiddenError, NotFoundError } from '../shared/errors.js';
import { spaceContentPath } from '../shared/space-paths.js';
import { initializeSpaceInMonorepo } from '../infrastructure/provisioning/monorepo-space-initializer.js';

export interface SpaceServiceDeps {
  registry: SpaceRegistryPort;
  git: GitRepositoryPort;
  manifest: SpaceManifestPort;
  publish: PublishService;
  defaultS3Bucket: string;
  defaultBranch: string;
}

export class SpaceService {
  constructor(private readonly deps: SpaceServiceDeps) {}

  async listSpaces(user: User): Promise<Space[]> {
    return this.deps.registry.listSpacesForUser(user.id);
  }

  async createSpace(user: User, params: CreateSpaceParams): Promise<Space> {
    const existing = await this.deps.registry.findSpaceBySlug(params.slug);
    if (existing) throw new ForbiddenError('Space slug already exists');

    await this.deps.git.ensureRepoReady();
    const monorepoGit = this.deps.git as MonorepoGitAdapter;
    const contentPath = spaceContentPath(params.slug);
    if (await monorepoGit.contentPathExists(contentPath)) {
      throw new ForbiddenError('Space content path already exists in monorepo');
    }

    await initializeSpaceInMonorepo(
      monorepoGit,
      params.slug,
      user.displayName ?? user.id,
      user.email,
    );

    const s3Prefix = params.s3Prefix ?? `${params.slug}/`;
    const space = await this.deps.registry.createSpace({
      id: randomUUID(),
      slug: params.slug,
      title: params.title,
      defaultBranch: this.deps.defaultBranch,
      s3Bucket: this.deps.defaultS3Bucket,
      s3Prefix,
      departmentSlug: params.departmentSlug ?? null,
      contentPath,
    });

    await this.deps.registry.addMember(space.id, user.id, 'admin');
    await this.deps.publish.publishSpace(user, space.id, `Create space ${params.slug}`);
    return space;
  }

  async getSpaceTree(user: User, spaceId: string): Promise<PageRef[]> {
    const space = await this.requireSpaceAccess(user, spaceId, 'viewer');
    await this.deps.git.ensureRepoReady();
    const manifest = await this.deps.manifest.loadManifest(space.contentPath);
    if (manifest.spaceId !== space.slug) {
      throw new ForbiddenError('Space manifest spaceId does not match registry slug');
    }
    return this.deps.manifest.buildPageTree(manifest);
  }

  async requireSpaceAccess(
    user: User,
    spaceId: string,
    minRole: SpaceMemberRole,
  ): Promise<Space> {
    const space = await this.deps.registry.findSpaceById(spaceId);
    if (!space) throw new NotFoundError('Space not found');
    const member = await this.deps.registry.getMember(spaceId, user.id);
    if (!member || !roleAtLeast(member.role, minRole)) {
      throw new ForbiddenError('Insufficient space access');
    }
    return space;
  }

  async findSpaceBySlugForUser(user: User, slug: string): Promise<Space | null> {
    const space = await this.deps.registry.findSpaceBySlug(slug);
    if (!space) return null;
    const member = await this.deps.registry.getMember(space.id, user.id);
    if (!member) return null;
    return space;
  }
}

function roleAtLeast(actual: SpaceMemberRole, required: SpaceMemberRole): boolean {
  const order: SpaceMemberRole[] = ['viewer', 'editor', 'admin'];
  return order.indexOf(actual) >= order.indexOf(required);
}
