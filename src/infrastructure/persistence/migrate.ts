import type Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      parent_id TEXT,
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      folder_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content_json TEXT NOT NULL,
      content_plain TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0,
      version INTEGER NOT NULL DEFAULT 1,
      visibility TEXT NOT NULL DEFAULT 'private',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      page_id TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      original_filename TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS page_permissions (
      page_id TEXT NOT NULL,
      grantee_type TEXT NOT NULL,
      grantee_id TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_folders_owner ON folders(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(owner_user_id, parent_id);
    CREATE INDEX IF NOT EXISTS idx_pages_folder ON pages(owner_user_id, folder_id);
    CREATE INDEX IF NOT EXISTS idx_pages_search ON pages(owner_user_id, folder_id, content_plain);
  `);

  backfillPagePositions(db);
}

function backfillPagePositions(db: Database.Database): void {
  const hasPosition = db
    .prepare(
      `SELECT COUNT(*) AS n FROM pragma_table_info('pages') WHERE name = 'position'`,
    )
    .get() as { n: number };

  if (hasPosition.n === 0) {
    db.exec(`ALTER TABLE pages ADD COLUMN position INTEGER NOT NULL DEFAULT 0`);
  }

  const folders = db
    .prepare(`SELECT DISTINCT folder_id AS folderId, owner_user_id AS ownerUserId FROM pages`)
    .all() as { folderId: string; ownerUserId: string }[];

  const listStmt = db.prepare(
    `SELECT id FROM pages
     WHERE folder_id = ? AND owner_user_id = ?
     ORDER BY updated_at ASC, title ASC`,
  );
  const updateStmt = db.prepare(
    `UPDATE pages SET position = ? WHERE id = ? AND owner_user_id = ?`,
  );

  for (const { folderId, ownerUserId } of folders) {
    const rows = listStmt.all(folderId, ownerUserId) as { id: string }[];
    rows.forEach((row, index) => {
      updateStmt.run(index, row.id, ownerUserId);
    });
  }
}
