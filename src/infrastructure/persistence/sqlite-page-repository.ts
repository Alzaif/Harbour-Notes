import { and, eq, like, max, or } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { PageRepositoryPort } from '../../domain/ports/page-repository.port.js';
import type { Page, PageSummary } from '../../domain/entities/page.js';
import type { ClockPort } from '../../domain/ports/clock.port.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import type { NotesDatabase } from './create-database.js';
import { pages } from './schema.js';

function mapRow(row: typeof pages.$inferSelect): Page {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    folderId: row.folderId,
    title: row.title,
    contentJson: row.contentJson,
    contentPlain: row.contentPlain,
    version: row.version,
    visibility: row.visibility as Page['visibility'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapSummary(row: typeof pages.$inferSelect): PageSummary {
  return {
    id: row.id,
    folderId: row.folderId,
    title: row.title,
    position: row.position,
    version: row.version,
    updatedAt: row.updatedAt,
  };
}

export class SqlitePageRepository implements PageRepositoryPort {
  constructor(
    private readonly db: NotesDatabase,
    private readonly clock: ClockPort,
  ) {}

  async listByFolder(ownerUserId: string, folderId: string): Promise<PageSummary[]> {
    const rows = await this.db
      .select()
      .from(pages)
      .where(and(eq(pages.ownerUserId, ownerUserId), eq(pages.folderId, folderId)))
      .orderBy(pages.position, pages.title);
    return rows.map(mapSummary);
  }

  async searchInFolder(
    ownerUserId: string,
    folderId: string,
    query: string,
  ): Promise<PageSummary[]> {
    const q = query.trim();
    if (!q) return this.listByFolder(ownerUserId, folderId);
    const pattern = `%${q.replace(/[%_]/g, '\\$&')}%`;
    const rows = await this.db
      .select()
      .from(pages)
      .where(
        and(
          eq(pages.ownerUserId, ownerUserId),
          eq(pages.folderId, folderId),
          or(like(pages.title, pattern), like(pages.contentPlain, pattern)),
        ),
      )
      .orderBy(pages.position, pages.title);
    return rows.map(mapSummary);
  }

  async findById(ownerUserId: string, id: string): Promise<Page | null> {
    const rows = await this.db
      .select()
      .from(pages)
      .where(and(eq(pages.id, id), eq(pages.ownerUserId, ownerUserId)))
      .limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(params: {
    ownerUserId: string;
    folderId: string;
    title: string;
    contentJson: string;
    contentPlain: string;
  }): Promise<Page> {
    const now = this.clock.now();
    const id = randomUUID();
    const maxRow = await this.db
      .select({ maxPosition: max(pages.position) })
      .from(pages)
      .where(
        and(eq(pages.ownerUserId, params.ownerUserId), eq(pages.folderId, params.folderId)),
      );
    const position = (maxRow[0]?.maxPosition ?? -1) + 1;
    await this.db.insert(pages).values({
      id,
      ownerUserId: params.ownerUserId,
      folderId: params.folderId,
      title: params.title,
      contentJson: params.contentJson,
      contentPlain: params.contentPlain,
      position,
      version: 1,
      visibility: 'private',
      createdAt: now,
      updatedAt: now,
    });
    return (await this.findById(params.ownerUserId, id))!;
  }

  async update(
    ownerUserId: string,
    id: string,
    expectedVersion: number,
    patch: {
      title?: string;
      contentJson?: string;
      contentPlain?: string;
    },
  ): Promise<Page> {
    const existing = await this.findById(ownerUserId, id);
    if (!existing) throw new NotFoundError('Page not found');
    if (existing.version !== expectedVersion) {
      throw new ConflictError('Page version mismatch');
    }

    const nextTitle = patch.title ?? existing.title;
    const nextContentJson = patch.contentJson ?? existing.contentJson;
    const nextContentPlain = patch.contentPlain ?? existing.contentPlain;

    if (
      nextTitle === existing.title &&
      nextContentJson === existing.contentJson &&
      nextContentPlain === existing.contentPlain
    ) {
      return existing;
    }

    const now = this.clock.now();
    await this.db
      .update(pages)
      .set({
        title: nextTitle,
        contentJson: nextContentJson,
        contentPlain: nextContentPlain,
        version: existing.version + 1,
        updatedAt: now,
      })
      .where(
        and(
          eq(pages.id, id),
          eq(pages.ownerUserId, ownerUserId),
          eq(pages.version, expectedVersion),
        ),
      );
    const updated = await this.findById(ownerUserId, id);
    if (!updated || updated.version !== existing.version + 1) {
      throw new ConflictError('Page version mismatch');
    }
    return updated;
  }

  async reorderInFolder(
    ownerUserId: string,
    folderId: string,
    orderedPageIds: readonly string[],
  ): Promise<PageSummary[]> {
    const current = await this.listByFolder(ownerUserId, folderId);
    const currentIds = new Set(current.map((p) => p.id));
    if (orderedPageIds.length !== currentIds.size) {
      throw new ConflictError('Page list must include every page in the folder');
    }
    for (const pageId of orderedPageIds) {
      if (!currentIds.has(pageId)) {
        throw new NotFoundError('Page not found in folder');
      }
    }

    await Promise.all(
      orderedPageIds.map((pageId, position) =>
        this.db
          .update(pages)
          .set({ position })
          .where(and(eq(pages.id, pageId), eq(pages.ownerUserId, ownerUserId))),
      ),
    );

    return this.listByFolder(ownerUserId, folderId);
  }

  async delete(ownerUserId: string, id: string): Promise<void> {
    await this.db
      .delete(pages)
      .where(and(eq(pages.id, id), eq(pages.ownerUserId, ownerUserId)));
  }

  async deleteByFolder(ownerUserId: string, folderId: string): Promise<void> {
    await this.db
      .delete(pages)
      .where(and(eq(pages.folderId, folderId), eq(pages.ownerUserId, ownerUserId)));
  }
}
