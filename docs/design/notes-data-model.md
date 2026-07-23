# Notes data model

**Status:** Superseded by VCS + Spaces architecture for page content.

See [notes-vcs-spaces-architecture.md](./notes-vcs-spaces-architecture.md).

## Registry (SQLite)

| Table | Purpose |
|-------|---------|
| `users` | Gateway identity upsert |
| `spaces` | Space registry (slug, `content_path`, S3 prefix) |
| `space_members` | ACL: viewer / editor / admin |
| `publish_revisions` | Last in-process publish SHA per space |
| `space_pull_requests` | Latest GitHub PR URL per space + user |

## Deprecated (removed)

The previous folder/page/attachment SQLite wiki model has been replaced. Page bodies live in Git; published snapshots live on S3.
