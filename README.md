# Harbour Notes

Personal wiki satellite for the [Harbour](https://github.com/your-org/harbour) platform — nested folders, TipTap rich-text pages, image uploads, in-folder search, and markdown export.

## Architecture

Hexagonal TypeScript: Hono API + React/Vite UI. Identity comes from Traefik ForwardAuth (`X-Harbour-*` headers); no login UI in this service.

See [AGENTS.md](./AGENTS.md) and [docs/design/](./docs/design/).

## Prerequisites

- Node.js 22+
- For full stack: [harbour-infra](../harbour-infra) with Portcullis + Traefik

## Local development

**API** (terminal 1):

```bash
cp config/env.example .env.local
export $(grep -v '^#' .env.local | xargs)
export TRUST_GATEWAY_HEADERS=false
export DEV_USER_ID=alice
export DEV_USER_EMAIL=alice@example.com
npm install
npm run dev:api
```

**UI** (terminal 2):

```bash
npm run dev:web
```

Open http://localhost:5174

Or both: `npm run dev` (after `npm install`).

## Container stack / harbour.local

Built and orchestrated by [harbour-infra](../harbour-infra) (Podman by default; Docker: `./scripts/docker/up.sh`):

```bash
cd ../harbour-infra
./scripts/up.sh
```

Sign in at https://harbour.local, then open Notes from the launcher or https://notes.harbour.local.

## API (MVP)

| Method | Path |
|--------|------|
| GET | `/health`, `/version` |
| GET/POST/PATCH/DELETE | `/api/folders`, `/api/folders/:id` |
| GET | `/api/folders/:id/pages?q=` |
| GET/POST/PUT/DELETE | `/api/pages`, `/api/pages/:id` |
| POST | `/api/pages/:id/attachments` |
| GET | `/api/attachments/:id/content` |
| GET | `/api/pages/:id/export/markdown` |

## Related repos

- **harbour-platform-ui** — launcher shell
- **portcullis** — SSO and ForwardAuth
- **harbour-infra** — Compose stack
