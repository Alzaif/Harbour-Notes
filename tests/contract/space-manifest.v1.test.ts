import { describe, expect, it } from 'vitest';
import { parseSpaceManifestV1 } from '../../src/contracts/space-manifest.v1.js';

describe('harbour.space-manifest.v1', () => {
  it('parses a valid manifest', () => {
    const manifest = parseSpaceManifestV1({
      schema: 'harbour.space-manifest.v1',
      spaceId: 'engineering',
      tree: [
        {
          pageId: 'onboarding',
          title: 'Onboarding',
          path: 'pages/onboarding.md',
          children: [
            {
              pageId: 'dev-setup',
              title: 'Dev setup',
              path: 'pages/onboarding/setup.md',
            },
          ],
        },
      ],
      publish: { contentFormat: 'markdown', assetsGlob: 'assets/**' },
    });
    expect(manifest.spaceId).toBe('engineering');
    expect(manifest.tree[0]?.children).toHaveLength(1);
  });

  it('rejects invalid schema id', () => {
    expect(() =>
      parseSpaceManifestV1({
        schema: 'wrong',
        spaceId: 'x',
        tree: [],
      }),
    ).toThrow();
  });
});
