# Notes — future sharing and collaboration

**Scope:** Architectural direction only — **not implemented in MVP**.

## Sharing model (planned)

`page_permissions` grants access to a page for:

| `grantee_type` | Example `grantee_id` |
|----------------|----------------------|
| `user` | Harbour user id from Portcullis |
| `group` | Future family/workspace group id |

| `role` | Capability |
|--------|------------|
| `viewer` | Read |
| `editor` | Read + write |
| `admin` | Read + write + manage ACL |

`pages.visibility`:

- `private` — owner + explicit grants only (MVP default).
- `workspace` — members of a future workspace.
- `platform` — discoverable to authenticated Harbour users (directory integration required).

## Platform user visibility

Satellite apps must **not** call Authentik directly. Future options:

- Portcullis or a platform **user directory API** (read-only list for invite UI).
- `UserDirectoryPort` in notes — stub in MVP, adapter when API exists.

## Sync and multi-editor

| Approach | Pros | Cons |
|----------|------|------|
| **Versioned REST** (current) | Simple, works offline-ish | Manual conflict resolution (409) |
| **Yjs + TipTap Collaboration** | Real-time co-editing | Infra for WS/CRDT sync service |
| **Event patches** | Audit trail | More application complexity |

**Recommendation:** keep `version` + 409 for MVP; add Yjs when sharing ships. Document conflict UX: reload + merge for editors.

## Messaging

Domain events (`PageUpdated`, `FolderMoved`) can publish to `MessageBusPort` later for search indexing or notifications — in-memory bus only in scaffold today.
