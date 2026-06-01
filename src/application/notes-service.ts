import type { User } from '../domain/entities/user.js';
import type { Folder, FolderTreeNode } from '../domain/entities/folder.js';
import type { Page, PageSummary } from '../domain/entities/page.js';
import type { Attachment } from '../domain/entities/attachment.js';
import type { UserRepositoryPort } from '../domain/ports/user-repository.port.js';
import type { FolderRepositoryPort } from '../domain/ports/folder-repository.port.js';
import type { PageRepositoryPort } from '../domain/ports/page-repository.port.js';
import type { AttachmentStorePort } from '../domain/ports/attachment-store.port.js';
import { ConflictError, NotFoundError, ValidationError } from '../shared/errors.js';
import { EMPTY_DOC_JSON, extractPlainText } from '../shared/extract-plain-text.js';
import { tiptapJsonToMarkdown } from '../shared/tiptap-to-markdown.js';

export interface NotesServiceDeps {
  users: UserRepositoryPort;
  folders: FolderRepositoryPort;
  pages: PageRepositoryPort;
  attachments: AttachmentStorePort;
}

export class NotesService {
  constructor(private readonly deps: NotesServiceDeps) {}

  async listFolderTree(user: User): Promise<FolderTreeNode[]> {
    return this.deps.folders.listTree(user.id);
  }

  async createFolder(
    user: User,
    params: { name: string; parentId?: string | null },
  ): Promise<Folder> {
    const name = params.name.trim();
    if (!name) throw new ValidationError('Folder name is required');
    const siblings = await this.getSiblingFolders(user.id, params.parentId ?? null);
    return this.deps.folders.create({
      ownerUserId: user.id,
      parentId: params.parentId ?? null,
      name,
      position: siblings.length,
    });
  }

  async updateFolder(
    user: User,
    id: string,
    patch: { name?: string; parentId?: string | null; position?: number },
  ): Promise<Folder> {
    if (patch.name !== undefined && !patch.name.trim()) {
      throw new ValidationError('Folder name is required');
    }
    return this.deps.folders.update(user.id, id, {
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.parentId !== undefined ? { parentId: patch.parentId } : {}),
      ...(patch.position !== undefined ? { position: patch.position } : {}),
    });
  }

  async deleteFolder(user: User, id: string): Promise<void> {
    const childCount = await this.deps.folders.countChildren(user.id, id);
    if (childCount > 0) {
      throw new ConflictError('Folder is not empty (contains subfolders)');
    }
    const pageCount = await this.deps.folders.countPagesInFolder(user.id, id);
    if (pageCount > 0) {
      throw new ConflictError('Folder is not empty (contains pages)');
    }
    await this.deps.folders.delete(user.id, id);
  }

  async listPages(user: User, folderId: string): Promise<PageSummary[]> {
    await this.requireFolder(user.id, folderId);
    return this.deps.pages.listByFolder(user.id, folderId);
  }

  async searchPages(
    user: User,
    folderId: string,
    query: string,
  ): Promise<PageSummary[]> {
    await this.requireFolder(user.id, folderId);
    return this.deps.pages.searchInFolder(user.id, folderId, query);
  }

  async createPage(
    user: User,
    params: { folderId: string; title?: string },
  ): Promise<Page> {
    await this.requireFolder(user.id, params.folderId);
    const title = (params.title ?? 'Untitled').trim() || 'Untitled';
    return this.deps.pages.create({
      ownerUserId: user.id,
      folderId: params.folderId,
      title,
      contentJson: EMPTY_DOC_JSON,
      contentPlain: '',
    });
  }

  async getPage(user: User, id: string): Promise<Page> {
    const page = await this.deps.pages.findById(user.id, id);
    if (!page) throw new NotFoundError('Page not found');
    return page;
  }

  async updatePage(
    user: User,
    id: string,
    expectedVersion: number,
    patch: { title?: string; contentJson?: string },
  ): Promise<Page> {
    const contentPlain =
      patch.contentJson !== undefined
        ? extractPlainText(patch.contentJson)
        : undefined;
    return this.deps.pages.update(user.id, id, expectedVersion, {
      ...(patch.title !== undefined ? { title: patch.title.trim() || 'Untitled' } : {}),
      ...(patch.contentJson !== undefined ? { contentJson: patch.contentJson } : {}),
      ...(contentPlain !== undefined ? { contentPlain } : {}),
    });
  }

  async reorderPages(
    user: User,
    folderId: string,
    orderedPageIds: readonly string[],
  ): Promise<PageSummary[]> {
    await this.requireFolder(user.id, folderId);
    if (orderedPageIds.length === 0) {
      return this.deps.pages.listByFolder(user.id, folderId);
    }
    return this.deps.pages.reorderInFolder(user.id, folderId, orderedPageIds);
  }

  async deletePage(user: User, id: string): Promise<void> {
    await this.deps.attachments.deleteByPage(user.id, id);
    await this.deps.pages.delete(user.id, id);
  }

  async uploadAttachment(
    user: User,
    pageId: string,
    file: { mimeType: string; originalFilename: string; data: Buffer },
  ): Promise<{ attachment: Attachment; url: string }> {
    await this.getPage(user, pageId);
    if (!file.mimeType.startsWith('image/')) {
      throw new ValidationError('Only image uploads are supported');
    }
    const attachment = await this.deps.attachments.create({
      ownerUserId: user.id,
      pageId,
      mimeType: file.mimeType,
      originalFilename: file.originalFilename,
      data: file.data,
    });
    return {
      attachment,
      url: `/api/attachments/${attachment.id}/content`,
    };
  }

  async getAttachmentContent(user: User, id: string): Promise<{ data: Buffer; mimeType: string }> {
    const att = await this.deps.attachments.findById(user.id, id);
    if (!att) throw new NotFoundError('Attachment not found');
    const data = await this.deps.attachments.readContent(user.id, id);
    if (!data) throw new NotFoundError('Attachment file not found');
    return { data, mimeType: att.mimeType };
  }

  exportPageMarkdown(page: Page): string {
    return tiptapJsonToMarkdown(page.contentJson, page.title);
  }

  private async requireFolder(ownerUserId: string, folderId: string): Promise<Folder> {
    const folder = await this.deps.folders.findById(ownerUserId, folderId);
    if (!folder) throw new NotFoundError('Folder not found');
    return folder;
  }

  private async getSiblingFolders(
    ownerUserId: string,
    parentId: string | null,
  ): Promise<Folder[]> {
    const tree = await this.deps.folders.listTree(ownerUserId);
    if (!parentId) return flattenFolders(tree);
    const parent = findInTree(tree, parentId);
    return parent?.children.map((c) => ({ ...c, children: [] })) ?? [];
  }
}

function flattenFolders(nodes: FolderTreeNode[]): Folder[] {
  const result: Folder[] = [];
  for (const n of nodes) {
    result.push({
      id: n.id,
      ownerUserId: n.ownerUserId,
      parentId: n.parentId,
      name: n.name,
      position: n.position,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    });
    result.push(...flattenFolders(n.children));
  }
  return result;
}

function findInTree(
  nodes: FolderTreeNode[],
  id: string,
): FolderTreeNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findInTree(n.children, id);
    if (found) return found;
  }
  return undefined;
}
