export type PageVisibility = 'private' | 'workspace' | 'platform';

export interface Page {
  readonly id: string;
  readonly ownerUserId: string;
  readonly folderId: string;
  readonly title: string;
  readonly contentJson: string;
  readonly contentPlain: string;
  readonly version: number;
  readonly visibility: PageVisibility;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PageSummary {
  readonly id: string;
  readonly folderId: string;
  readonly title: string;
  readonly position: number;
  readonly version: number;
  readonly updatedAt: Date;
}
