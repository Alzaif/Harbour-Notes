import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const spaces = sqliteTable(
  'spaces',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    gitRemote: text('git_remote'),
    defaultBranch: text('default_branch').notNull().default('main'),
    s3Bucket: text('s3_bucket').notNull(),
    s3Prefix: text('s3_prefix').notNull(),
    departmentSlug: text('department_slug'),
    localRepoPath: text('local_repo_path'),
    contentPath: text('content_path').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => [index('spaces_department_idx').on(t.departmentSlug)],
);

export const spaceMembers = sqliteTable(
  'space_members',
  {
    spaceId: text('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.spaceId, t.userId] })],
);

export const publishRevisions = sqliteTable(
  'publish_revisions',
  {
    id: text('id').primaryKey(),
    spaceId: text('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    gitSha: text('git_sha').notNull(),
    publishedAt: integer('published_at', { mode: 'timestamp' }).notNull(),
    manifestEtag: text('manifest_etag'),
  },
  (t) => [index('publish_revisions_space_idx').on(t.spaceId, t.publishedAt)],
);

export const spacePullRequests = sqliteTable(
  'space_pull_requests',
  {
    spaceId: text('space_id')
      .notNull()
      .references(() => spaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    prUrl: text('pr_url').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.spaceId, t.userId] })],
);
