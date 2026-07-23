import type { User } from '../domain/entities/user.js';
import type { Space, SpaceMemberRole } from '../domain/entities/space.js';
import type { PublishResult, PublishStatus } from '../domain/entities/page-content.js';
import type { SpaceRegistryPort } from '../domain/ports/space-registry.port.js';
import type { GitRepositoryPort } from '../domain/ports/git-repository.port.js';
import type { PublishedContentPort } from '../domain/ports/published-content.port.js';
import type { SpaceManifestPort } from '../domain/ports/space-manifest.port.js';
import type { GitHostingPort, GitSyncResult } from '../domain/ports/git-hosting.port.js';
import { renderAndUploadSpace } from './publish-space-content.js';
import { parseSpacePublishedV1 } from '../contracts/space-published.v1.js';
import { ForbiddenError, NotFoundError } from '../shared/errors.js';

export interface PublishServiceDeps {
  registry: SpaceRegistryPort;
  git: GitRepositoryPort;
  manifest: SpaceManifestPort;
  published: PublishedContentPort;
  gitHosting: GitHostingPort;
  callbackSecret: string;
}

export class PublishService {
  constructor(private readonly deps: PublishServiceDeps) {}

  async publishSpace(user: User, spaceId: string, commitMessage: string): Promise<PublishResult> {
    const space = await this.requireSpaceAccess(user, spaceId, 'editor');
    await this.deps.git.ensureRepoReady();
    const gitSha = await this.deps.git.getHeadSha();

    const result = await renderAndUploadSpace({
      space,
      git: this.deps.git,
      manifest: this.deps.manifest,
      published: this.deps.published,
      gitSha,
    });

    await this.deps.registry.recordPublishRevision({
      spaceId: space.id,
      gitSha: result.gitSha,
      publishedAt: new Date(result.publishedAt),
      manifestEtag: null,
    });

    const sync = await this.syncToGitHub(user, space, gitSha, commitMessage);
    if (sync.prUrl) {
      await this.deps.registry.upsertPullRequestUrl(space.id, user.id, sync.prUrl);
    }

    return result;
  }

  private async syncToGitHub(
    user: User,
    space: Space,
    gitSha: string,
    commitMessage: string,
  ): Promise<GitSyncResult> {
    try {
      return await this.deps.gitHosting.syncSpaceChanges({
        spaceSlug: space.slug,
        userId: user.id,
        userEmail: user.email,
        commitSha: gitSha,
        commitMessage,
      });
    } catch (err) {
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'GitHub sync failed after publish',
          spaceId: space.id,
          spaceSlug: space.slug,
          err: err instanceof Error ? err.message : String(err),
        }),
      );
      return { branch: '', prUrl: null };
    }
  }

  async getPublishStatus(user: User, spaceId: string): Promise<PublishStatus> {
    await this.requireSpaceAccess(user, spaceId, 'viewer');
    await this.deps.git.ensureRepoReady();
    const headGitSha = await this.deps.git.getHeadSha();
    const latest = await this.deps.registry.getLatestPublishRevision(spaceId);
    const publishedGitSha = latest?.gitSha ?? null;
    const commitsAhead = publishedGitSha
      ? await this.deps.git.listCommitsSince(publishedGitSha)
      : await this.deps.git.listCommitsSince(null);
    const prUrl = await this.deps.registry.getPullRequestUrl(spaceId, user.id);

    return {
      spaceId,
      publishedGitSha,
      publishedAt: latest?.publishedAt.toISOString() ?? null,
      headGitSha,
      commitsAhead,
      isPublished: publishedGitSha === headGitSha,
      prUrl,
    };
  }

  async getPullRequestUrl(user: User, spaceId: string): Promise<{ prUrl: string | null }> {
    await this.requireSpaceAccess(user, spaceId, 'viewer');
    const prUrl = await this.deps.registry.getPullRequestUrl(spaceId, user.id);
    return { prUrl };
  }

  async recordPublishCallback(body: unknown, secret: string | undefined): Promise<void> {
    if (secret !== this.deps.callbackSecret) {
      throw new Error('Invalid publish callback secret');
    }
    const event = parseSpacePublishedV1(body);
    const space = await this.deps.registry.findSpaceBySlug(event.spaceId);
    if (!space) {
      const byId = await this.deps.registry.findSpaceById(event.spaceId);
      if (!byId) throw new Error('Unknown space');
      await this.deps.registry.recordPublishRevision({
        spaceId: byId.id,
        gitSha: event.gitSha,
        publishedAt: new Date(event.publishedAt),
        manifestEtag: event.manifestEtag ?? null,
      });
      return;
    }
    await this.deps.registry.recordPublishRevision({
      spaceId: space.id,
      gitSha: event.gitSha,
      publishedAt: new Date(event.publishedAt),
      manifestEtag: event.manifestEtag ?? null,
    });
  }

  private async requireSpaceAccess(
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
}

function roleAtLeast(actual: SpaceMemberRole, required: SpaceMemberRole): boolean {
  const order: SpaceMemberRole[] = ['viewer', 'editor', 'admin'];
  return order.indexOf(actual) >= order.indexOf(required);
}
