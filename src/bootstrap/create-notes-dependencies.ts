import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { SpaceService } from '../application/space-service.js';
import { PageContentService } from '../application/page-content-service.js';
import { PublishService } from '../application/publish-service.js';
import { SystemClock } from '../infrastructure/adapters/system-clock.js';
import { loadConfig, type NotesConfig } from '../infrastructure/config/load-config.js';
import { buildGitRemoteUrl } from '../infrastructure/config/build-git-remote-url.js';
import { createRegistryDatabase } from '../infrastructure/registry/create-registry-database.js';
import { SqliteUserRepository } from '../infrastructure/registry/sqlite-user-repository.js';
import { SqliteSpaceRegistry } from '../infrastructure/registry/sqlite-space-registry.js';
import { MonorepoGitAdapter } from '../infrastructure/git/monorepo-git-adapter.js';
import { FilesystemPublishedContentAdapter } from '../infrastructure/publish/filesystem-published-content-adapter.js';
import { S3PublishedContentAdapter } from '../infrastructure/publish/s3-published-content-adapter.js';
import { YamlSpaceManifestAdapter } from '../infrastructure/manifest/yaml-space-manifest-adapter.js';
import { GithubGitHostingAdapter } from '../infrastructure/git-hosting/github-git-hosting-adapter.js';
import type { PublishedContentPort } from '../domain/ports/published-content.port.js';

export interface NotesDependencies {
  config: NotesConfig;
  users: SqliteUserRepository;
  spaces: SpaceService;
  pages: PageContentService;
  publish: PublishService;
}

export async function createNotesDependencies(
  env: NodeJS.ProcessEnv = process.env,
): Promise<NotesDependencies> {
  const config = loadConfig(env);
  if (!env.NOTES_GIT_USER_NAME) env.NOTES_GIT_USER_NAME = config.GIT_USER_NAME;
  if (!env.NOTES_GIT_USER_EMAIL) env.NOTES_GIT_USER_EMAIL = config.GIT_USER_EMAIL;
  if (!env.NOTES_SPACE_TEMPLATE_DIR && config.SPACE_TEMPLATE_DIR) {
    env.NOTES_SPACE_TEMPLATE_DIR = config.SPACE_TEMPLATE_DIR;
  }
  await mkdir(config.DATA_DIR, { recursive: true });
  await mkdir(config.CONTENT_REPO_PATH, { recursive: true });
  await mkdir(config.PUBLISH_STORAGE_DIR, { recursive: true });
  await mkdir(dirname(config.REGISTRY_DB_PATH), { recursive: true });

  const { db } = createRegistryDatabase(config.REGISTRY_DB_PATH);
  const clock = new SystemClock();
  const users = new SqliteUserRepository(db, clock);
  const registry = new SqliteSpaceRegistry(db, clock);

  const gitRemote = buildGitRemoteUrl(config);
  const git = new MonorepoGitAdapter(config.CONTENT_REPO_PATH, config.DEFAULT_BRANCH, gitRemote);
  await git.ensureRepoReady();

  const manifest = new YamlSpaceManifestAdapter(git);

  let published: PublishedContentPort;
  if (config.USE_S3_PUBLISH && config.S3_ENDPOINT) {
    published = new S3PublishedContentAdapter({
      endpoint: config.S3_ENDPOINT,
      region: config.S3_REGION,
      bucket: config.S3_BUCKET,
      accessKeyId: config.S3_ACCESS_KEY_ID,
      secretAccessKey: config.S3_SECRET_ACCESS_KEY,
      forcePathStyle: config.S3_FORCE_PATH_STYLE,
    });
  } else {
    published = new FilesystemPublishedContentAdapter(config.PUBLISH_STORAGE_DIR);
  }

  const gitHosting = new GithubGitHostingAdapter(
    {
      repo: config.GITHUB_REPO,
      token: config.GITHUB_TOKEN,
      baseBranch: config.GITHUB_BASE_BRANCH,
    },
    git,
  );

  const publish = new PublishService({
    registry,
    git,
    manifest,
    published,
    gitHosting,
    callbackSecret: config.PUBLISH_CALLBACK_SECRET,
  });

  const spaces = new SpaceService({
    registry,
    git,
    manifest,
    publish,
    defaultS3Bucket: config.S3_BUCKET,
    defaultBranch: config.DEFAULT_BRANCH,
  });

  const pages = new PageContentService({ spaces, publish, published, git, manifest });

  return { config, users, spaces, pages, publish };
}
