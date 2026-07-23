# Harbour Notes — Agent Guide

Harbour **satellite** service: Confluence-style **Spaces** with GitHub content monorepo and auto-publish on save.

## Boundaries

- **Do not** implement login or OIDC — identity is `X-Harbour-User-Id`, etc. from ForwardAuth.
- **Do not** share a database with other Harbour services.
- Page bodies live in the **GitHub content monorepo** (cloned to `NOTES_CONTENT_REPO_PATH`), not SQLite.
- **GitHub is required** — `NOTES_GITHUB_REPO` and `NOTES_GITHUB_TOKEN` must be set; every save pushes and opens/updates a PR.

## Hexagonal layout

| Layer | Path |
|-------|------|
| Domain | `src/domain/` |
| Application | `src/application/` (`SpaceService`, `PageContentService`, `PublishService`) |
| Contracts | `src/contracts/` (manifest schemas) |
| Infrastructure | GitHub git hosting, S3/MinIO, registry SQLite |
| Presentation | React SPA with `/spaces/:spaceId/pages/:pageId` routes |

## Docs

| Path | Purpose |
|------|---------|
| `docs/design/notes-vcs-spaces-architecture.md` | GitHub monorepo + publish design |
| `docs/design/notes-data-model.md` | Registry schema |

## Commands

```bash
npm run dev
npm run test
npm run typecheck
npm run dev:fixtures      # seed demo space (requires GitHub env)
```
