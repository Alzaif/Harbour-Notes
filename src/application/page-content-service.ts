import type { User } from '../domain/entities/user.js';
import type { PageSaveResult, PublishedPage, SourcePage } from '../domain/entities/page-content.js';
import type { PublishedContentPort } from '../domain/ports/published-content.port.js';
import type { GitRepositoryPort } from '../domain/ports/git-repository.port.js';
import type { SpaceManifestPort } from '../domain/ports/space-manifest.port.js';
import type { SpaceService } from './space-service.js';
import type { PublishService } from './publish-service.js';
import { NotFoundError, ValidationError } from '../shared/errors.js';
import { parseMarkdownFrontmatter, serializeMarkdownFrontmatter } from '../shared/markdown-frontmatter.js';
import {
  SPACE_MANIFEST_FILENAME,
  type SpaceManifestTreeNodeV1,
} from '../contracts/space-manifest.v1.js';
import {
  derivePageRepoPath,
  insertPageIntoManifestTree,
} from '../shared/manifest-tree.js';
import YAML from 'yaml';

export interface PageContentServiceDeps {
  spaces: SpaceService;
  publish: PublishService;
  published: PublishedContentPort;
  git: GitRepositoryPort;
  manifest: SpaceManifestPort;
}

export class PageContentService {
  constructor(private readonly deps: PageContentServiceDeps) {}

  async getPublishedPage(user: User, spaceId: string, pageId: string): Promise<PublishedPage> {
    const space = await this.deps.spaces.requireSpaceAccess(user, spaceId, 'viewer');
    await this.deps.git.ensureRepoReady();
    const manifestDoc = await this.deps.manifest.loadManifest(space.contentPath);
    const tree = this.deps.manifest.buildPageTree(manifestDoc);
    const pageRef = this.deps.manifest.findPageInTree(tree, pageId);
    if (!pageRef) throw new NotFoundError('Page not found');

    const publishManifest = await this.deps.published.getPublishManifest(space.s3Bucket, space.s3Prefix);
    const entry = publishManifest?.pages.find((p) => p.pageId === pageId);
    if (!entry) throw new NotFoundError('Page not published yet');

    const object = await this.deps.published.getObject(space.s3Bucket, entry.publishedKey);
    return {
      pageId,
      title: entry.title,
      contentType: object.contentType.startsWith('text/html') ? 'text/html' : 'text/markdown',
      body: object.body,
      etag: object.etag,
      publishedAt: publishManifest!.publishedAt,
    };
  }

  async getSourcePage(user: User, spaceId: string, pageId: string): Promise<SourcePage> {
    const space = await this.deps.spaces.requireSpaceAccess(user, spaceId, 'editor');
    await this.deps.git.ensureRepoReady();
    const manifestDoc = await this.deps.manifest.loadManifest(space.contentPath);
    const tree = this.deps.manifest.buildPageTree(manifestDoc);
    const pageRef = this.deps.manifest.findPageInTree(tree, pageId);
    if (!pageRef) throw new NotFoundError('Page not found');

    const raw = await this.deps.git.readFile(space.contentPath, pageRef.repoPath);
    const gitSha = await this.deps.git.getHeadSha();
    const { title, body } = parseMarkdownFrontmatter(raw);
    return {
      pageId,
      title: title ?? pageRef.title,
      repoPath: pageRef.repoPath,
      contentMarkdown: body,
      gitSha,
    };
  }

  async commitPage(
    user: User,
    spaceId: string,
    pageId: string,
    params: { baseSha: string; title: string; contentMarkdown: string },
  ): Promise<PageSaveResult> {
    const space = await this.deps.spaces.requireSpaceAccess(user, spaceId, 'editor');
    await this.deps.git.ensureRepoReady();
    const manifestDoc = await this.deps.manifest.loadManifest(space.contentPath);
    const tree = this.deps.manifest.buildPageTree(manifestDoc);
    const pageRef = this.deps.manifest.findPageInTree(tree, pageId);
    if (!pageRef) throw new NotFoundError('Page not found');

    const serialized = serializeMarkdownFrontmatter(params.title, params.contentMarkdown);
    const result = await this.deps.git.writeFileAndCommit({
      contentPath: space.contentPath,
      relativePath: pageRef.repoPath,
      content: serialized,
      message: `Update page ${pageId}`,
      authorName: user.displayName ?? user.id,
      authorEmail: user.email,
      baseSha: params.baseSha,
    });

    const published = await this.deps.publish.publishSpace(user, spaceId, result.message);
    const status = await this.deps.publish.getPublishStatus(user, spaceId);

    return {
      pageId,
      title: params.title,
      repoPath: pageRef.repoPath,
      contentMarkdown: params.contentMarkdown,
      gitSha: result.sha,
      publishedAt: published.publishedAt,
      prUrl: status.prUrl,
    };
  }

  async createPage(
    user: User,
    spaceId: string,
    params: {
      pageId: string;
      title: string;
      parentPageId?: string | null;
      contentMarkdown?: string;
      baseSha: string;
    },
  ): Promise<PageSaveResult> {
    const space = await this.deps.spaces.requireSpaceAccess(user, spaceId, 'editor');
    await this.deps.git.ensureRepoReady();
    const manifestDoc = await this.deps.manifest.loadManifest(space.contentPath);
    const tree = this.deps.manifest.buildPageTree(manifestDoc);
    if (this.deps.manifest.findPageInTree(tree, params.pageId)) {
      throw new ValidationError('Page id already exists');
    }

    let parentRepoPath: string | null = null;
    if (params.parentPageId) {
      const parent = this.deps.manifest.findPageInTree(tree, params.parentPageId);
      if (!parent) throw new NotFoundError('Parent page not found');
      parentRepoPath = parent.repoPath;
    }

    const repoPath = derivePageRepoPath(params.pageId, parentRepoPath);
    const newNode: SpaceManifestTreeNodeV1 = {
      pageId: params.pageId,
      title: params.title,
      path: repoPath,
    };
    const updatedTree = insertPageIntoManifestTree(
      manifestDoc.tree,
      newNode,
      params.parentPageId ?? null,
    );
    const updatedManifest = YAML.stringify({ ...manifestDoc, tree: updatedTree });
    const pageContent = serializeMarkdownFrontmatter(
      params.title,
      params.contentMarkdown ?? '',
    );

    const result = await this.deps.git.writeFilesAndCommit({
      contentPath: space.contentPath,
      files: [
        { relativePath: SPACE_MANIFEST_FILENAME, content: updatedManifest },
        { relativePath: repoPath, content: pageContent },
      ],
      message: `Create page ${params.pageId}`,
      authorName: user.displayName ?? user.id,
      authorEmail: user.email,
      baseSha: params.baseSha,
    });

    const published = await this.deps.publish.publishSpace(user, spaceId, result.message);
    const status = await this.deps.publish.getPublishStatus(user, spaceId);

    return {
      pageId: params.pageId,
      title: params.title,
      repoPath,
      contentMarkdown: params.contentMarkdown ?? '',
      gitSha: result.sha,
      publishedAt: published.publishedAt,
      prUrl: status.prUrl,
    };
  }
}
