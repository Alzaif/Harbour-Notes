# Harbour Notes — Agent Guide

Harbour **satellite** service: personal wiki (folders, rich-text pages, attachments).

Read the platform [technical design](../harbour-platform-ui/harbour-technical-design.md) for phases and gateway auth.

## Boundaries

- **Do not** implement login or OIDC — identity is `X-Harbour-User-Id`, `X-Harbour-Email`, etc. from Traefik ForwardAuth only in production.
- **Do not** share a database with other Harbour services.
- **Do not** call Authentik or Portcullis from the browser for auth (cookie is set at `harbour.local`).

## Hexagonal layout

| Layer | Path |
|-------|------|
| Domain | `src/domain/` |
| Application | `src/application/` (`NotesService`) |
| Infrastructure | `src/infrastructure/` (HTTP, SQLite, filesystem) |
| Presentation | `src/presentation/` (React SPA) |
| Contracts | `src/contracts/` (`gateway-headers.v1.ts`) |

## Docs

| Path | Purpose |
|------|---------|
| `docs/design/notes-data-model.md` | Entities and delete rules |
| `docs/design/notes-editor-and-attachments.md` | TipTap and uploads |
| `docs/design/notes-future-sharing.md` | ACL / sync (future) |

## Commands

```bash
npm run dev          # API + Vite
npm run test
npm run typecheck
npm run build
```

Docker image exposes port **80** (nginx + API on 3000 inside container).
