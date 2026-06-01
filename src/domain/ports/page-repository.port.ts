import type { Page, PageSummary } from '../entities/page.js';

export interface PageRepositoryPort {
  listByFolder(ownerUserId: string, folderId: string): Promise<PageSummary[]>;
  searchInFolder(
    ownerUserId: string,
    folderId: string,
    query: string,
  ): Promise<PageSummary[]>;
  findById(ownerUserId: string, id: string): Promise<Page | null>;
  create(params: {
    ownerUserId: string;
    folderId: string;
    title: string;
    contentJson: string;
    contentPlain: string;
  }): Promise<Page>;
  update(
    ownerUserId: string,
    id: string,
    expectedVersion: number,
    patch: {
      title?: string;
      contentJson?: string;
      contentPlain?: string;
    },
  ): Promise<Page>;
  reorderInFolder(
    ownerUserId: string,
    folderId: string,
    orderedPageIds: readonly string[],
  ): Promise<PageSummary[]>;
  delete(ownerUserId: string, id: string): Promise<void>;
  deleteByFolder(ownerUserId: string, folderId: string): Promise<void>;
}
