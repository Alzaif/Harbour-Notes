import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { NotesService } from '../application/notes-service.js';
import { SystemClock } from '../infrastructure/adapters/system-clock.js';
import { loadConfig, type NotesConfig } from '../infrastructure/config/load-config.js';
import { createDatabase } from '../infrastructure/persistence/create-database.js';
import { SqliteUserRepository } from '../infrastructure/persistence/sqlite-user-repository.js';
import { SqliteFolderRepository } from '../infrastructure/persistence/sqlite-folder-repository.js';
import { SqlitePageRepository } from '../infrastructure/persistence/sqlite-page-repository.js';
import { LocalFilesystemAttachmentStore } from '../infrastructure/storage/local-filesystem-attachment-store.js';

export interface NotesDependencies {
  config: NotesConfig;
  users: SqliteUserRepository;
  notes: NotesService;
}

export async function createNotesDependencies(
  env: NodeJS.ProcessEnv = process.env,
): Promise<NotesDependencies> {
  const config = loadConfig(env);
  await mkdir(config.DATA_DIR, { recursive: true });
  await mkdir(dirname(config.DB_PATH), { recursive: true });

  const { db } = createDatabase(config.DB_PATH);
  const clock = new SystemClock();
  const users = new SqliteUserRepository(db, clock);
  const folders = new SqliteFolderRepository(db, clock);
  const pages = new SqlitePageRepository(db, clock);
  const attachments = new LocalFilesystemAttachmentStore(db, clock, config.DATA_DIR);
  const notes = new NotesService({ users, folders, pages, attachments });

  return { config, users, notes };
}
