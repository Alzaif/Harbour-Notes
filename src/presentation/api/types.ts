export interface FolderTreeNode {
  id: string;
  ownerUserId: string;
  parentId: string | null;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  children: FolderTreeNode[];
}

export interface PageSummary {
  id: string;
  folderId: string;
  title: string;
  position: number;
  version: number;
  updatedAt: string;
}

export interface Page extends PageSummary {
  ownerUserId: string;
  contentJson: string;
  contentPlain: string;
  visibility: string;
  createdAt: string;
}
