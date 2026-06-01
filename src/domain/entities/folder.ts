export interface Folder {
  readonly id: string;
  readonly ownerUserId: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly position: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface FolderTreeNode extends Folder {
  readonly children: FolderTreeNode[];
}
