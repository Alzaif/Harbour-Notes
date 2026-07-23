import type { PageRef } from '../api/types.js';

export function findPageInTree(tree: readonly PageRef[], pageId: string): PageRef | null {
  for (const node of tree) {
    if (node.pageId === pageId) return node;
    const found = findPageInTree(node.children, pageId);
    if (found) return found;
  }
  return null;
}

export function getPageAncestors(tree: readonly PageRef[], pageId: string): PageRef[] {
  const walk = (nodes: readonly PageRef[], trail: PageRef[]): PageRef[] | null => {
    for (const node of nodes) {
      const next = [...trail, node];
      if (node.pageId === pageId) return trail;
      const found = walk(node.children, next);
      if (found) return found;
    }
    return null;
  };
  return walk(tree, []) ?? [];
}

export function collectExpandablePageIds(tree: readonly PageRef[]): string[] {
  const ids: string[] = [];
  for (const node of tree) {
    if (node.children.length > 0) {
      ids.push(node.pageId);
      ids.push(...collectExpandablePageIds(node.children));
    }
  }
  return ids;
}

export function getExpandedIdsForPage(tree: readonly PageRef[], pageId: string | null): Set<string> {
  if (!pageId) return new Set(collectExpandablePageIds(tree));
  const ancestors = getPageAncestors(tree, pageId);
  return new Set(ancestors.filter((node) => node.children.length > 0).map((node) => node.pageId));
}

export function filterPageTree(tree: readonly PageRef[], query: string): PageRef[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...tree];

  const filterNode = (node: PageRef): PageRef | null => {
    const filteredChildren = node.children
      .map(filterNode)
      .filter((child): child is PageRef => child !== null);
    const matches = node.title.toLowerCase().includes(q) || node.pageId.toLowerCase().includes(q);
    if (matches || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  };

  return tree.map(filterNode).filter((node): node is PageRef => node !== null);
}

export function spaceInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase();
}

export function pageEmoji(pageId: string): string {
  const icons = ['📄', '📝', '📋', '📌', '🚀', '📎', '📁', '✨'];
  let hash = 0;
  for (let i = 0; i < pageId.length; i += 1) {
    hash = (hash + pageId.charCodeAt(i)) % icons.length;
  }
  return icons[hash] ?? '📄';
}
