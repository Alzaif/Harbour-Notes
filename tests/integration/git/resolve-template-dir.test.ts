import { describe, expect, it } from 'vitest';
import { resolveExistingSpaceTemplateDir } from '../../../src/infrastructure/git/resolve-template-dir.js';

describe('resolveExistingSpaceTemplateDir', () => {
  it('finds fixtures/space-template from repo root', async () => {
    const dir = await resolveExistingSpaceTemplateDir();
    expect(dir).toMatch(/fixtures\/space-template$/);
  });
});
