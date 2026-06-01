import type { FolderTreeNode } from '../api/types.js';

export interface FlatFolder {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly path: readonly { id: string; name: string }[];
}

export function flattenFolders(
  nodes: readonly FolderTreeNode[],
  ancestors: readonly { id: string; name: string }[] = [],
): FlatFolder[] {
  const result: FlatFolder[] = [];
  for (const node of nodes) {
    const path = [...ancestors, { id: node.id, name: node.name }];
    result.push({
      id: node.id,
      name: node.name,
      parentId: node.parentId,
      path,
    });
    result.push(...flattenFolders(node.children, path));
  }
  return result;
}

export function findFolderPath(
  nodes: readonly FolderTreeNode[],
  folderId: string,
): readonly { id: string; name: string }[] | null {
  for (const node of nodes) {
    if (node.id === folderId) {
      return [{ id: node.id, name: node.name }];
    }
    const child = findFolderPath(node.children, folderId);
    if (child) {
      return [{ id: node.id, name: node.name }, ...child];
    }
  }
  return null;
}
