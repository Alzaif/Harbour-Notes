import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NotesService } from '../../../src/application/notes-service.js';
import { SystemClock } from '../../../src/infrastructure/adapters/system-clock.js';
import { createDatabase } from '../../../src/infrastructure/persistence/create-database.js';
import { SqliteUserRepository } from '../../../src/infrastructure/persistence/sqlite-user-repository.js';
import { SqliteFolderRepository } from '../../../src/infrastructure/persistence/sqlite-folder-repository.js';
import { SqlitePageRepository } from '../../../src/infrastructure/persistence/sqlite-page-repository.js';
import { LocalFilesystemAttachmentStore } from '../../../src/infrastructure/storage/local-filesystem-attachment-store.js';
import { ConflictError } from '../../../src/shared/errors.js';
import { EMPTY_DOC_JSON } from '../../../src/shared/extract-plain-text.js';

function createService() {
  const dir = mkdtempSync(join(tmpdir(), 'notes-unit-'));
  const { db } = createDatabase(join(dir, 'test.db'));
  const clock = new SystemClock();
  const users = new SqliteUserRepository(db, clock);
  const folders = new SqliteFolderRepository(db, clock);
  const pages = new SqlitePageRepository(db, clock);
  const attachments = new LocalFilesystemAttachmentStore(db, clock, dir);
  const notes = new NotesService({ users, folders, pages, attachments });
  return { notes, users };
}

describe('NotesService', () => {
  it('scopes data per user', async () => {
    const { notes, users } = createService();
    const alice = await users.upsertFromGateway({
      id: 'alice',
      email: 'alice@test',
    });
    const bob = await users.upsertFromGateway({ id: 'bob', email: 'bob@test' });

    const folder = await notes.createFolder(alice, { name: 'Personal' });
    await notes.createPage(alice, { folderId: folder.id });

    const bobTree = await notes.listFolderTree(bob);
    expect(bobTree).toHaveLength(0);
  });

  it('rejects delete of non-empty folder', async () => {
    const { notes, users } = createService();
    const user = await users.upsertFromGateway({ id: 'u1', email: 'u1@test' });
    const folder = await notes.createFolder(user, { name: 'Docs' });
    await notes.createPage(user, { folderId: folder.id });
    await expect(notes.deleteFolder(user, folder.id)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('increments page version on update', async () => {
    const { notes, users } = createService();
    const user = await users.upsertFromGateway({ id: 'u2', email: 'u2@test' });
    const folder = await notes.createFolder(user, { name: 'A' });
    const page = await notes.createPage(user, { folderId: folder.id, title: 'Hi' });
    const updated = await notes.updatePage(user, page.id, 1, {
      contentJson: EMPTY_DOC_JSON,
      title: 'Hello',
    });
    expect(updated.version).toBe(2);
    await expect(
      notes.updatePage(user, page.id, 1, { title: 'Stale' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('does not increment version when content is unchanged', async () => {
    const { notes, users } = createService();
    const user = await users.upsertFromGateway({ id: 'u4', email: 'u4@test' });
    const folder = await notes.createFolder(user, { name: 'B' });
    const page = await notes.createPage(user, { folderId: folder.id, title: 'Same' });
    const unchanged = await notes.updatePage(user, page.id, 1, {
      contentJson: page.contentJson,
      title: 'Same',
    });
    expect(unchanged.version).toBe(1);
  });

  it('reorders pages without changing version', async () => {
    const { notes, users } = createService();
    const user = await users.upsertFromGateway({ id: 'u5', email: 'u5@test' });
    const folder = await notes.createFolder(user, { name: 'C' });
    const p1 = await notes.createPage(user, { folderId: folder.id, title: 'One' });
    const p2 = await notes.createPage(user, { folderId: folder.id, title: 'Two' });
    const reordered = await notes.reorderPages(user, folder.id, [p2.id, p1.id]);
    expect(reordered.map((p) => p.title)).toEqual(['Two', 'One']);
    const p1Again = await notes.getPage(user, p1.id);
    expect(p1Again.version).toBe(1);
  });

  it('searches pages within folder', async () => {
    const { notes, users } = createService();
    const user = await users.upsertFromGateway({ id: 'u3', email: 'u3@test' });
    const folder = await notes.createFolder(user, { name: 'F' });
    const page = await notes.createPage(user, { folderId: folder.id, title: 'Recipes' });
    await notes.updatePage(user, page.id, 1, {
      contentJson: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'chocolate cake' }] },
        ],
      }),
    });
    const hits = await notes.searchPages(user, folder.id, 'chocolate');
    expect(hits).toHaveLength(1);
    expect(hits[0]!.title).toBe('Recipes');
  });
});
