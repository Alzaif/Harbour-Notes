import { describe, expect, it } from 'vitest';
import { buildPageTreeFromManifest, derivePageRepoPath, findPageInTree, flattenPageTree, insertPageIntoManifestTree } from '../../../src/shared/manifest-tree.js';

describe('manifest-tree', () => {
  const tree = buildPageTreeFromManifest([
    {
      pageId: 'root',
      title: 'Root',
      path: 'pages/root.md',
      children: [{ pageId: 'child', title: 'Child', path: 'pages/child.md' }],
    },
  ]);

  it('finds nested page by id', () => {
    expect(findPageInTree(tree, 'child')?.repoPath).toBe('pages/child.md');
  });

  it('flattens tree', () => {
    expect(flattenPageTree(tree)).toHaveLength(2);
  });

  it('derives repo path from parent', () => {
    expect(derivePageRepoPath('new-page', null)).toBe('pages/new-page.md');
    expect(derivePageRepoPath('child', 'pages/onboarding.md')).toBe('pages/onboarding/child.md');
  });

  it('inserts page into manifest tree', () => {
    const updated = insertPageIntoManifestTree(
      [{ pageId: 'root', title: 'Root', path: 'pages/root.md' }],
      { pageId: 'child', title: 'Child', path: 'pages/root/child.md' },
      'root',
    );
    expect(updated[0]?.children).toHaveLength(1);
  });
});
