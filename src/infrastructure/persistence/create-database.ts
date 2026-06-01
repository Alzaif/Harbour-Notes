import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { runMigrations } from './migrate.js';

export function createDatabase(dbPath: string) {
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  runMigrations(sqlite);
  const db = drizzle(sqlite);
  return { sqlite, db };
}

export type NotesDatabase = ReturnType<typeof createDatabase>['db'];
