import { describe, expect, it } from 'vitest';
import { parsePublishManifestV1 } from '../../src/contracts/publish-manifest.v1.js';

describe('harbour.publish-manifest.v1', () => {
  it('parses a valid publish manifest', () => {
    const manifest = parsePublishManifestV1({
      schema: 'harbour.publish-manifest.v1',
      spaceId: 'engineering',
      gitSha: 'abc123',
      publishedAt: '2026-07-08T12:00:00.000Z',
      pages: [
        {
          pageId: 'onboarding',
          title: 'Onboarding',
          publishedKey: 'pages/onboarding.html',
          contentHash: 'deadbeef',
        },
      ],
    });
    expect(manifest.pages).toHaveLength(1);
    expect(manifest.gitSha).toBe('abc123');
  });
});
