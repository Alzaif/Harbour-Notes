import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { marked } from 'marked';
import {
  PUBLISH_MANIFEST_SCHEMA_ID,
  type PublishManifestV1,
} from '../contracts/publish-manifest.v1.js';
import { buildPageTreeFromManifest, flattenPageTree } from '../shared/manifest-tree.js';
import { resolveInContentRepo } from '../shared/space-paths.js';
import type { GitRepositoryPort } from '../domain/ports/git-repository.port.js';
import type { SpaceManifestPort } from '../domain/ports/space-manifest.port.js';
import type { PublishedContentPort } from '../domain/ports/published-content.port.js';
import type { Space } from '../domain/entities/space.js';
import type { PublishResult } from '../domain/entities/page-content.js';

export async function renderAndUploadSpace(params: {
  space: Space;
  git: GitRepositoryPort;
  manifest: SpaceManifestPort;
  published: PublishedContentPort;
  gitSha: string;
}): Promise<PublishResult> {
  const { space, git, manifest, published, gitSha } = params;
  const manifestDoc = await manifest.loadManifest(space.contentPath);
  const pages = flattenPageTree(buildPageTreeFromManifest(manifestDoc.tree));
  const prefix = space.s3Prefix;
  const manifestPages: PublishManifestV1['pages'] = [];
  const repoRoot = git.getRepoRoot();

  for (const page of pages) {
    const md = await readFile(
      resolveInContentRepo(repoRoot, space.contentPath, page.repoPath),
      'utf8',
    );
    const html = marked.parse(md) as string;
    const htmlKey = `${prefix.replace(/\/?$/, '/')}pages/${page.pageId}.html`;
    const contentHash = createHash('sha256').update(html).digest('hex').slice(0, 16);
    await published.putObject(space.s3Bucket, htmlKey, html, 'text/html');
    manifestPages.push({
      pageId: page.pageId,
      title: page.title,
      publishedKey: htmlKey,
      contentHash,
    });
  }

  const publishedAt = new Date().toISOString();
  const publishManifest: PublishManifestV1 = {
    schema: PUBLISH_MANIFEST_SCHEMA_ID,
    spaceId: manifestDoc.spaceId,
    gitSha,
    publishedAt,
    pages: manifestPages,
  };
  await published.putPublishManifest(space.s3Bucket, prefix, publishManifest);

  return {
    gitSha,
    publishedAt,
    pageCount: pages.length,
  };
}
