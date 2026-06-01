import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const folders = sqliteTable('folders', {
  id: text('id').primaryKey(),
  ownerUserId: text('owner_user_id').notNull(),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  position: integer('position').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  ownerUserId: text('owner_user_id').notNull(),
  folderId: text('folder_id').notNull(),
  title: text('title').notNull(),
  contentJson: text('content_json').notNull(),
  contentPlain: text('content_plain').notNull().default(''),
  position: integer('position').notNull().default(0),
  version: integer('version').notNull().default(1),
  visibility: text('visibility').notNull().default('private'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  ownerUserId: text('owner_user_id').notNull(),
  pageId: text('page_id').notNull(),
  storageKey: text('storage_key').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  originalFilename: text('original_filename').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/** Reserved for future sharing — unused in MVP. */
export const pagePermissions = sqliteTable('page_permissions', {
  pageId: text('page_id').notNull(),
  granteeType: text('grantee_type').notNull(),
  granteeId: text('grantee_id').notNull(),
  role: text('role').notNull(),
});
