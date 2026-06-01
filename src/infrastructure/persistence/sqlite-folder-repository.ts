import { and, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { FolderRepositoryPort } from '../../domain/ports/folder-repository.port.js';
import type { Folder, FolderTreeNode } from '../../domain/entities/folder.js';
import type { ClockPort } from '../../domain/ports/clock.port.js';
import { NotFoundError } from '../../shared/errors.js';
import type { NotesDatabase } from './create-database.js';
import { folders, pages } from './schema.js';

function mapRow(row: typeof folders.$inferSelect): Folder {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    parentId: row.parentId,
    name: row.name,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SqliteFolderRepository implements FolderRepositoryPort {
  constructor(
    private readonly db: NotesDatabase,
    private readonly clock: ClockPort,
  ) {}

  async listTree(ownerUserId: string): Promise<FolderTreeNode[]> {
    const rows = await this.db
      .select()
      .from(folders)
      .where(eq(folders.ownerUserId, ownerUserId))
      .orderBy(folders.position, folders.name);
    const nodes = new Map<string, FolderTreeNode>();
    for (const row of rows) {
      nodes.set(row.id, { ...mapRow(row), children: [] });
    }
    const roots: FolderTreeNode[] = [];
    for (const node of nodes.values()) {
      if (node.parentId && nodes.has(node.parentId)) {
        nodes.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  async findById(ownerUserId: string, id: string): Promise<Folder | null> {
    const rows = await this.db
      .select()
      .from(folders)
      .where(and(eq(folders.id, id), eq(folders.ownerUserId, ownerUserId)))
      .limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(params: {
    ownerUserId: string;
    parentId: string | null;
    name: string;
    position: number;
  }): Promise<Folder> {
    if (params.parentId) {
      const parent = await this.findById(params.ownerUserId, params.parentId);
      if (!parent) throw new NotFoundError('Parent folder not found');
    }
    const now = this.clock.now();
    const id = randomUUID();
    await this.db.insert(folders).values({
      id,
      ownerUserId: params.ownerUserId,
      parentId: params.parentId,
      name: params.name,
      position: params.position,
      createdAt: now,
      updatedAt: now,
    });
    return (await this.findById(params.ownerUserId, id))!;
  }

  async update(
    ownerUserId: string,
    id: string,
    patch: { name?: string; parentId?: string | null; position?: number },
  ): Promise<Folder> {
    const existing = await this.findById(ownerUserId, id);
    if (!existing) throw new NotFoundError('Folder not found');

    if (patch.parentId !== undefined && patch.parentId !== null) {
      if (patch.parentId === id) {
        throw new Error('Folder cannot be its own parent');
      }
      const parent = await this.findById(ownerUserId, patch.parentId);
      if (!parent) throw new NotFoundError('Parent folder not found');
      if (await this.isDescendant(ownerUserId, id, patch.parentId)) {
        throw new Error('Cannot move folder into its own descendant');
      }
    }

    const now = this.clock.now();
    await this.db
      .update(folders)
      .set({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.parentId !== undefined ? { parentId: patch.parentId } : {}),
        ...(patch.position !== undefined ? { position: patch.position } : {}),
        updatedAt: now,
      })
      .where(and(eq(folders.id, id), eq(folders.ownerUserId, ownerUserId)));

    return (await this.findById(ownerUserId, id))!;
  }

  async delete(ownerUserId: string, id: string): Promise<void> {
    const existing = await this.findById(ownerUserId, id);
    if (!existing) throw new NotFoundError('Folder not found');
    await this.db
      .delete(folders)
      .where(and(eq(folders.id, id), eq(folders.ownerUserId, ownerUserId)));
  }

  async countChildren(ownerUserId: string, id: string): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(folders)
      .where(and(eq(folders.ownerUserId, ownerUserId), eq(folders.parentId, id)));
    return Number(rows[0]?.count ?? 0);
  }

  async countPagesInFolder(ownerUserId: string, folderId: string): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(pages)
      .where(and(eq(pages.ownerUserId, ownerUserId), eq(pages.folderId, folderId)));
    return Number(rows[0]?.count ?? 0);
  }

  async isDescendant(
    ownerUserId: string,
    ancestorId: string,
    candidateId: string,
  ): Promise<boolean> {
    let current: string | null = candidateId;
    while (current) {
      if (current === ancestorId) return true;
      const row = await this.findById(ownerUserId, current);
      current = row?.parentId ?? null;
    }
    return false;
  }
}
