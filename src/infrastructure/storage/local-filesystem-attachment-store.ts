import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AttachmentStorePort } from '../../domain/ports/attachment-store.port.js';
import type { Attachment } from '../../domain/entities/attachment.js';
import type { ClockPort } from '../../domain/ports/clock.port.js';
import { eq, and } from 'drizzle-orm';
import type { NotesDatabase } from '../persistence/create-database.js';
import { attachments } from '../persistence/schema.js';

function mapRow(row: typeof attachments.$inferSelect): Attachment {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    pageId: row.pageId,
    storageKey: row.storageKey,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    originalFilename: row.originalFilename,
    createdAt: row.createdAt,
  };
}

export class LocalFilesystemAttachmentStore implements AttachmentStorePort {
  constructor(
    private readonly db: NotesDatabase,
    private readonly clock: ClockPort,
    private readonly dataDir: string,
  ) {}

  private filePath(storageKey: string): string {
    return join(this.dataDir, 'attachments', storageKey);
  }

  async create(params: {
    ownerUserId: string;
    pageId: string;
    mimeType: string;
    originalFilename: string;
    data: Buffer;
  }): Promise<Attachment> {
    const storageKey = randomUUID();
    const dir = join(this.dataDir, 'attachments');
    await mkdir(dir, { recursive: true });
    await writeFile(this.filePath(storageKey), params.data);

    const now = this.clock.now();
    const id = randomUUID();
    await this.db.insert(attachments).values({
      id,
      ownerUserId: params.ownerUserId,
      pageId: params.pageId,
      storageKey,
      mimeType: params.mimeType,
      sizeBytes: params.data.length,
      originalFilename: params.originalFilename,
      createdAt: now,
    });
    return (await this.findById(params.ownerUserId, id))!;
  }

  async findById(ownerUserId: string, id: string): Promise<Attachment | null> {
    const rows = await this.db
      .select()
      .from(attachments)
      .where(and(eq(attachments.id, id), eq(attachments.ownerUserId, ownerUserId)))
      .limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async readContent(ownerUserId: string, id: string): Promise<Buffer | null> {
    const att = await this.findById(ownerUserId, id);
    if (!att) return null;
    try {
      return await readFile(this.filePath(att.storageKey));
    } catch {
      return null;
    }
  }

  async deleteByPage(ownerUserId: string, pageId: string): Promise<void> {
    const rows = await this.db
      .select()
      .from(attachments)
      .where(and(eq(attachments.pageId, pageId), eq(attachments.ownerUserId, ownerUserId)));
    for (const row of rows) {
      await this.delete(ownerUserId, row.id);
    }
  }

  async delete(ownerUserId: string, id: string): Promise<void> {
    const att = await this.findById(ownerUserId, id);
    if (!att) return;
    try {
      await unlink(this.filePath(att.storageKey));
    } catch {
      /* file may already be gone */
    }
    await this.db
      .delete(attachments)
      .where(and(eq(attachments.id, id), eq(attachments.ownerUserId, ownerUserId)));
  }
}
