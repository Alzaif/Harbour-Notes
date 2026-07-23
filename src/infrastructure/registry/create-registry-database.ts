import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { runRegistryMigrations } from './migrate.js';
import * as schema from './schema.js';

export function createRegistryDatabase(dbPath: string) {
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  runRegistryMigrations(sqlite);
  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}
