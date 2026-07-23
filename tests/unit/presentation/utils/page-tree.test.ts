import { describe, expect, it } from 'vitest';
import {
  filterPageTree,
  findPageInTree,
  getPageAncestors,
  pageEmoji,
  spaceInitials,
} from '../../../../src/presentation/utils/page-tree.js';
import type { PageRef } from '../../../../src/presentation/api/types.js';

const tree: PageRef[] = [
  {
    pageId: 'onboarding',
    title: 'Onboarding',
    repoPath: 'pages/onboarding.md',
    parentPageId: null,
    children: [
      {
        pageId: 'setup',
        title: 'Setup',
        repoPath: 'pages/onboarding/setup.md',
        parentPageId: 'onboarding',
        children: [],
      },
    ],
  },
];

describe('page-tree utils', () => {
  it('finds nested pages', () => {
    expect(findPageInTree(tree, 'setup')?.title).toBe('Setup');
  });

  it('returns ancestor chain', () => {
    expect(getPageAncestors(tree, 'setup').map((p) => p.pageId)).toEqual(['onboarding']);
  });

  it('filters tree by title', () => {
    const filtered = filterPageTree(tree, 'setup');
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.children[0]?.pageId).toBe('setup');
  });

  it('derives space initials', () => {
    expect(spaceInitials('Product Management')).toBe('PM');
  });

  it('picks stable page emoji', () => {
    expect(pageEmoji('setup')).toBe(pageEmoji('setup'));
  });
});
