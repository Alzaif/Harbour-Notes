import { describe, expect, it } from 'vitest';
import {
  resolveContentPathAbsolute,
  resolveInContentRepo,
  spaceContentPath,
  spaceManifestRelativePath,
} from '../../../src/shared/space-paths.js';

describe('space-paths', () => {
  it('builds monorepo content path from slug', () => {
    expect(spaceContentPath('engineering')).toBe('spaces/engineering');
  });

  it('resolves manifest path within content repo', () => {
    expect(spaceManifestRelativePath('spaces/engineering')).toBe(
      'spaces/engineering/harbour.space.manifest.yaml',
    );
  });

  it('resolves page file absolute path', () => {
    expect(resolveInContentRepo('/repo', 'spaces/test', 'pages/home.md')).toBe(
      '/repo/spaces/test/pages/home.md',
    );
  });

  it('resolves content directory absolute path', () => {
    expect(resolveContentPathAbsolute('/repo', 'spaces/test')).toBe('/repo/spaces/test');
  });
});
