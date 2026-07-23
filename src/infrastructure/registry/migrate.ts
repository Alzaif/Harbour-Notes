import type Database from 'better-sqlite3';

type ColumnInfo = { name: string; notnull: number };

export function runRegistryMigrations(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL,
      display_name TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      git_remote TEXT,
      default_branch TEXT NOT NULL DEFAULT 'main',
      s3_bucket TEXT NOT NULL,
      s3_prefix TEXT NOT NULL,
      department_slug TEXT,
      local_repo_path TEXT,
      content_path TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS spaces_department_idx ON spaces(department_slug);

    CREATE TABLE IF NOT EXISTS space_members (
      space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      joined_at INTEGER NOT NULL,
      PRIMARY KEY (space_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS publish_revisions (
      id TEXT PRIMARY KEY NOT NULL,
      space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
      git_sha TEXT NOT NULL,
      published_at INTEGER NOT NULL,
      manifest_etag TEXT
    );
    CREATE INDEX IF NOT EXISTS publish_revisions_space_idx ON publish_revisions(space_id, published_at);

    CREATE TABLE IF NOT EXISTS space_pull_requests (
      space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pr_url TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (space_id, user_id)
    );
  `);

  const columns = sqlite.prepare(`PRAGMA table_info(spaces)`).all() as ColumnInfo[];
  const hasContentPath = columns.some((c) => c.name === 'content_path');
  if (!hasContentPath) {
    sqlite.exec(`ALTER TABLE spaces ADD COLUMN content_path TEXT`);
  }

  sqlite.exec(`
    UPDATE spaces SET content_path = 'spaces/' || slug WHERE content_path IS NULL OR content_path = '';
  `);

  const localRepoPath = columns.find((c) => c.name === 'local_repo_path');
  if (localRepoPath?.notnull === 1) {
    rebuildSpacesTableWithoutLegacyConstraints(sqlite);
  }
}

function rebuildSpacesTableWithoutLegacyConstraints(sqlite: Database.Database): void {
  sqlite.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN;
    CREATE TABLE spaces_v2 (
      id TEXT PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      git_remote TEXT,
      default_branch TEXT NOT NULL DEFAULT 'main',
      s3_bucket TEXT NOT NULL,
      s3_prefix TEXT NOT NULL,
      department_slug TEXT,
      local_repo_path TEXT,
      content_path TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    INSERT INTO spaces_v2 (
      id, slug, title, git_remote, default_branch, s3_bucket, s3_prefix,
      department_slug, local_repo_path, content_path, created_at, updated_at
    )
    SELECT
      id, slug, title, git_remote, default_branch, s3_bucket, s3_prefix,
      department_slug, NULL, COALESCE(NULLIF(content_path, ''), 'spaces/' || slug),
      created_at, updated_at
    FROM spaces;
    DROP TABLE spaces;
    ALTER TABLE spaces_v2 RENAME TO spaces;
    CREATE INDEX IF NOT EXISTS spaces_department_idx ON spaces(department_slug);
    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
}
