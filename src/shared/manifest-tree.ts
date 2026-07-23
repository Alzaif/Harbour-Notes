import type { SpaceManifestTreeNodeV1 } from '../contracts/space-manifest.v1.js';
import type { PageRef } from '../domain/entities/page-content.js';

export function buildPageTreeFromManifest(nodes: SpaceManifestTreeNodeV1[], parentPageId: string | null = null): PageRef[] {
  return nodes.map((node) => ({
    pageId: node.pageId,
    title: node.title,
    repoPath: node.path,
    parentPageId,
    children: buildPageTreeFromManifest(node.children ?? [], node.pageId),
  }));
}

export function findPageInTree(tree: PageRef[], pageId: string): PageRef | null {
  for (const node of tree) {
    if (node.pageId === pageId) return node;
    const found = findPageInTree(node.children, pageId);
    if (found) return found;
  }
  return null;
}

export function flattenPageTree(tree: PageRef[]): PageRef[] {
  const out: PageRef[] = [];
  for (const node of tree) {
    out.push(node);
    out.push(...flattenPageTree(node.children));
  }
  return out;
}

/** Derive a new page repo path from optional parent path. */
export function derivePageRepoPath(pageId: string, parentRepoPath: string | null): string {
  if (!parentRepoPath) return `pages/${pageId}.md`;
  const parentDir = parentRepoPath.replace(/\.md$/i, '');
  return `${parentDir}/${pageId}.md`;
}

export function insertPageIntoManifestTree(
  tree: SpaceManifestTreeNodeV1[],
  node: SpaceManifestTreeNodeV1,
  parentPageId: string | null,
): SpaceManifestTreeNodeV1[] {
  if (!parentPageId) return [...tree, node];

  const insert = (nodes: SpaceManifestTreeNodeV1[]): SpaceManifestTreeNodeV1[] =>
    nodes.map((entry) => {
      if (entry.pageId === parentPageId) {
        return { ...entry, children: [...(entry.children ?? []), node] };
      }
      if (entry.children?.length) {
        return { ...entry, children: insert(entry.children) };
      }
      return entry;
    });

  return insert(tree);
}
