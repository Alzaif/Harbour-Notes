import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import YAML from 'yaml';
import { renderAndUploadSpace } from '../../../src/application/publish-space-content.js';
import { MonorepoGitAdapter } from '../../../src/infrastructure/git/monorepo-git-adapter.js';
import { YamlSpaceManifestAdapter } from '../../../src/infrastructure/manifest/yaml-space-manifest-adapter.js';
import { FilesystemPublishedContentAdapter } from '../../../src/infrastructure/publish/filesystem-published-content-adapter.js';
import { SPACE_MANIFEST_FILENAME } from '../../../src/contracts/space-manifest.v1.js';
import { spaceContentPath } from '../../../src/shared/space-paths.js';
import { seedBareGitRemote } from '../../helpers/github-test-remote.js';

describe('renderAndUploadSpace', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('walks manifest pages and writes HTML to publish store', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'notes-publish-test-'));
    const gitRemoteUrl = await seedBareGitRemote(dir);
    const repoRoot = join(dir, 'content-repo');
    const publishDir = join(dir, 'published');
    const contentPath = spaceContentPath('demo');
    const git = new MonorepoGitAdapter(repoRoot, 'main', gitRemoteUrl);
    await git.ensureRepoReady();

    const manifest = {
      schema: 'harbour.space-manifest.v1' as const,
      spaceId: 'demo',
      tree: [
        {
          pageId: 'home',
          title: 'Home',
          path: 'pages/home.md',
          children: [],
        },
      ],
      publish: { contentFormat: 'markdown' as const, assetsGlob: 'assets/**' },
    };
    await mkdir(join(repoRoot, contentPath, 'pages'), { recursive: true });
    await writeFile(
      join(repoRoot, contentPath, SPACE_MANIFEST_FILENAME),
      YAML.stringify(manifest),
      'utf8',
    );
    await writeFile(join(repoRoot, contentPath, 'pages/home.md'), '# Hello\n\nWorld', 'utf8');
    await git.commitContentPath({
      contentPath,
      message: 'Seed demo space',
      authorName: 'Test',
      authorEmail: 'test@example.com',
      baseSha: await git.getHeadSha(),
    });
    const gitSha = await git.getHeadSha();

    const manifestPort = new YamlSpaceManifestAdapter(git);
    const published = new FilesystemPublishedContentAdapter(publishDir);
    const space = {
      id: 'space-id',
      slug: 'demo',
      title: 'Demo',
      defaultBranch: 'main',
      s3Bucket: 'harbour-notes-published',
      s3Prefix: 'demo/',
      departmentSlug: null,
      contentPath,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await renderAndUploadSpace({
      space,
      git,
      manifest: manifestPort,
      published,
      gitSha,
    });

    expect(result.pageCount).toBe(1);
    expect(result.gitSha).toBe(gitSha);

    const publishManifest = await published.getPublishManifest(space.s3Bucket, space.s3Prefix);
    expect(publishManifest?.pages[0]?.pageId).toBe('home');
    const html = await published.getObject(space.s3Bucket, publishManifest!.pages[0]!.publishedKey);
    expect(html.body).toContain('World');
  });
});
