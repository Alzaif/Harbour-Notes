# Notes data model

**Scope:** `harbour-notes` — entities, folder tree rules, delete semantics.

## Entities

| Entity | Key fields | Notes |
|--------|------------|-------|
| `User` | `id`, `email`, `displayName` | Upserted from `X-Harbour-*` gateway headers on each request |
| `Folder` | `parentId`, `name`, `position`, `ownerUserId` | Tree via nullable `parentId` |
| `Page` | `folderId`, `title`, `contentJson`, `contentPlain`, `version`, `visibility` | TipTap JSON + denormalized plain text for search |
| `Attachment` | `pageId`, `storageKey`, `mimeType` | Image files on disk under `DATA_DIR/attachments/` |

## Folder tree

- Roots: `parentId = null`, ordered by `position` then `name`.
- **Move:** cannot set `parentId` to self or any descendant (cycle prevention).
- **Delete:** allowed only when the folder has **no child folders** and **no pages**.

## Pages

- **Create:** default title `Untitled`, empty TipTap doc (`paragraph`).
- **Update:** optimistic concurrency via `version`; mismatch returns **409 Conflict**.
- **Delete:** removes page row and attachment files.

## Authorization (MVP)

All reads and writes filter by `ownerUserId = currentUser.id` from gateway identity.

## Future schema (unused in MVP)

- `page_permissions(page_id, grantee_type, grantee_id, role)` — sharing ACLs.
- `pages.visibility` — `private` | `workspace` | `platform` (default `private`).
