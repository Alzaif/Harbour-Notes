import { describe, expect, it } from 'vitest';
import { buildGitRemoteUrl } from '../../../../src/infrastructure/config/build-git-remote-url.js';
import type { NotesConfig } from '../../../../src/infrastructure/config/load-config.js';

function baseConfig(overrides: Partial<NotesConfig> = {}): NotesConfig {
  return {
    PORT: 3001,
    NODE_ENV: 'test',
    REGISTRY_DB_PATH: './data/registry.db',
    DATA_DIR: './data',
    CONTENT_REPO_PATH: './data/content-repo',
    PUBLISH_STORAGE_DIR: './data/published',
    GIT_USER_NAME: 'Harbour Notes',
    GIT_USER_EMAIL: 'notes@harbour.local',
    DEFAULT_BRANCH: 'main',
    TRUST_GATEWAY_HEADERS: false,
    PACKAGE_NAME: 'harbour-notes',
    PACKAGE_VERSION: '0.1.0',
    S3_REGION: 'us-east-1',
    S3_BUCKET: 'harbour-notes-published',
    S3_ACCESS_KEY_ID: 'minioadmin',
    S3_SECRET_ACCESS_KEY: 'minioadmin',
    S3_FORCE_PATH_STYLE: true,
    USE_S3_PUBLISH: false,
    PUBLISH_CALLBACK_SECRET: 'dev-publish-secret',
    GITHUB_REPO: 'acme/harbour-notes-content',
    GITHUB_TOKEN: 'ghp_test',
    GITHUB_BASE_BRANCH: 'main',
    ...overrides,
  };
}

describe('buildGitRemoteUrl', () => {
  it('builds authenticated GitHub clone URL', () => {
    const url = buildGitRemoteUrl(baseConfig());
    expect(url).toBe(
      'https://x-access-token:ghp_test@github.com/acme/harbour-notes-content.git',
    );
  });

  it('uses GIT_REMOTE_URL override in tests', () => {
    const url = buildGitRemoteUrl(
      baseConfig({ GIT_REMOTE_URL: 'file:///tmp/remote.git' }),
    );
    expect(url).toBe('file:///tmp/remote.git');
  });
});
