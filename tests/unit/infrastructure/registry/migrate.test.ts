import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { runRegistryMigrations } from '../../../../src/infrastructure/registry/migrate.js';

describe('runRegistryMigrations', () => {
  it('rebuilds legacy spaces table when local_repo_path is NOT NULL', () => {
    const sqlite = new Database(':memory:');
    sqlite.exec(`
      CREATE TABLE spaces (
        id TEXT PRIMARY KEY NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        git_remote TEXT,
        default_branch TEXT NOT NULL DEFAULT 'main',
        s3_bucket TEXT NOT NULL,
        s3_prefix TEXT NOT NULL,
        department_slug TEXT,
        local_repo_path TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      INSERT INTO spaces (
        id, slug, title, default_branch, s3_bucket, s3_prefix, local_repo_path, created_at, updated_at
      ) VALUES (
        'space-1', 'engineering', 'Engineering', 'main', 'bucket', 'engineering/',
        '/data/git-cache/engineering', 1, 1
      );
    `);

    runRegistryMigrations(sqlite);

    const columns = sqlite.prepare(`PRAGMA table_info(spaces)`).all() as {
      name: string;
      notnull: number;
    }[];
    const localRepo = columns.find((c) => c.name === 'local_repo_path');
    const contentPath = columns.find((c) => c.name === 'content_path');
    expect(localRepo?.notnull).toBe(0);
    expect(contentPath?.notnull).toBe(1);

    const row = sqlite
      .prepare(`SELECT slug, local_repo_path, content_path FROM spaces WHERE id = 'space-1'`)
      .get() as { slug: string; local_repo_path: string | null; content_path: string };
    expect(row.content_path).toBe('spaces/engineering');
    expect(row.local_repo_path).toBeNull();

    sqlite.close();
  });
});
