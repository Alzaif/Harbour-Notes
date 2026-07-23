# Harbour Notes

Confluence-style **Spaces** for the [Harbour](https://github.com/your-org/harbour) platform — GitHub-backed content monorepo, auto-publish on save, PR sync on every save.

## Architecture

Hexagonal TypeScript: Hono API + React/Vite UI. Identity from Traefik ForwardAuth (`X-Harbour-*` headers).

See [docs/design/notes-vcs-spaces-architecture.md](./docs/design/notes-vcs-spaces-architecture.md) and [AGENTS.md](./AGENTS.md).

## Prerequisites

Create a GitHub repository for wiki content and set:

```bash
NOTES_GITHUB_REPO=your-org/harbour-notes-content
NOTES_GITHUB_TOKEN=ghp_...   # repo contents + pull requests
NOTES_GITHUB_BASE_BRANCH=main
```

The API clones that repo into `NOTES_CONTENT_REPO_PATH` on startup. Every save commits locally, publishes read content, pushes a branch, and opens/updates a PR.

## Local development

**API** (terminal 1):

```bash
cp config/env.example .env.local
# Edit .env.local — set NOTES_GITHUB_REPO and NOTES_GITHUB_TOKEN
# Docker Compose uses harbour-infra/compose/.env (not this file) — keep both in sync
export $(grep -v '^#' .env.local | xargs)
export TRUST_GATEWAY_HEADERS=false
export DEV_USER_ID=dev-user
export DEV_USER_EMAIL=dev@example.com
npm install
npm run dev:api
```

**Seed a demo space** (terminal 2, once):

```bash
npm run dev:fixtures
```

**UI**:

```bash
npm run dev:web
```

Open http://localhost:5174/spaces

## API (Spaces)

| Method | Path |
|--------|------|
| GET | `/health`, `/version` |
| GET/POST | `/api/spaces` |
| GET | `/api/spaces/:spaceId/tree` |
| GET | `/api/spaces/:spaceId/pages/:pageId/published` |
| GET/PUT | `/api/spaces/:spaceId/pages/:pageId/source` |
| POST | `/api/spaces/:spaceId/pages` |
| GET | `/api/spaces/:spaceId/publish/status` |
| GET | `/api/spaces/:spaceId/git/pr` |
| POST | `/api/spaces/:spaceId/publish/callback` |

## MinIO (optional)

```bash
cd ../harbour-infra
docker compose -f compose/docker-compose.yml -f compose/docker-compose.notes-dev.yml up -d minio minio-init
```

Set `NOTES_USE_S3_PUBLISH=true` and `NOTES_S3_ENDPOINT=http://localhost:9000` on the API.
