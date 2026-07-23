import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { vi } from 'vitest';
import { createNotesDependencies } from '../../src/bootstrap/create-notes-dependencies.js';
import { createApp } from '../../src/infrastructure/http/app.js';
import { GATEWAY_HEADERS } from '../../src/contracts/gateway-headers.v1.js';
import {
  createGithubFetchMock,
  seedBareGitRemote,
  TEST_GITHUB_REPO,
  TEST_GITHUB_TOKEN,
} from './github-test-remote.js';

export async function createTestApp(user: {
  id: string;
  email: string;
  displayName?: string;
}) {
  const dir = mkdtempSync(join(tmpdir(), 'harbour-notes-test-'));
  const gitRemoteUrl = await seedBareGitRemote(dir);
  vi.stubGlobal('fetch', createGithubFetchMock());

  const deps = await createNotesDependencies({
    ...process.env,
    NODE_ENV: 'test',
    TRUST_GATEWAY_HEADERS: 'false',
    DEV_USER_ID: user.id,
    DEV_USER_EMAIL: user.email,
    DEV_USER_DISPLAY_NAME: user.displayName ?? user.id,
    NOTES_REGISTRY_DB_PATH: join(dir, 'registry.db'),
    NOTES_DATA_DIR: dir,
    NOTES_CONTENT_REPO_PATH: join(dir, 'content-repo'),
    NOTES_PUBLISH_STORAGE_DIR: join(dir, 'published'),
    USE_S3_PUBLISH: 'false',
    NOTES_GITHUB_REPO: TEST_GITHUB_REPO,
    NOTES_GITHUB_TOKEN: TEST_GITHUB_TOKEN,
    NOTES_GIT_REMOTE_URL: gitRemoteUrl,
  });
  const app = createApp(deps);
  const headers = {
    [GATEWAY_HEADERS.userId]: user.id,
    [GATEWAY_HEADERS.email]: user.email,
    ...(user.displayName ? { [GATEWAY_HEADERS.displayName]: user.displayName } : {}),
  };
  return { app, deps, headers, dataDir: dir };
}
