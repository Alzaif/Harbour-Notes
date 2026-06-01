import type { Folder, FolderTreeNode } from '../entities/folder.js';

export interface FolderRepositoryPort {
  listTree(ownerUserId: string): Promise<FolderTreeNode[]>;
  findById(ownerUserId: string, id: string): Promise<Folder | null>;
  create(params: {
    ownerUserId: string;
    parentId: string | null;
    name: string;
    position: number;
  }): Promise<Folder>;
  update(
    ownerUserId: string,
    id: string,
    patch: { name?: string; parentId?: string | null; position?: number },
  ): Promise<Folder>;
  delete(ownerUserId: string, id: string): Promise<void>;
  countChildren(ownerUserId: string, id: string): Promise<number>;
  countPagesInFolder(ownerUserId: string, folderId: string): Promise<number>;
  isDescendant(
    ownerUserId: string,
    ancestorId: string,
    candidateId: string,
  ): Promise<boolean>;
}
