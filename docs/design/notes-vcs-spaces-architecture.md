# Notes VCS + Spaces architecture

**Status:** Implemented (GitHub-only sync)  
**Scope:** Confluence-like Spaces backed by a GitHub content monorepo and S3/filesystem published read plane.

## Model

| Concept | Meaning |
|---------|---------|
| **Space** | Team/department wiki container; folder under the shared GitHub monorepo |
| **Content monorepo** | One GitHub repo cloned to `NOTES_CONTENT_REPO_PATH` (`spaces/{slug}/…`) |
| **Registry** | SQLite metadata: space config, members, publish revisions, PR URLs |
| **Space manifest** | `harbour.space.manifest.yaml` per space — stable `pageId` → repo path |
| **Publish manifest** | `publish-manifest.json` on S3/filesystem — `pageId` → published object keys |

## Layout

```
content-repo/
  spaces/
    engineering/
      harbour.space.manifest.yaml
      pages/
        onboarding.md
```

## Flows

### View (published)

1. User opens a page in Read mode
2. API loads publish manifest from the space publish prefix
3. API fetches HTML for the page (updated on every save)

### Edit + save

1. Editor loads source markdown from the local clone of the GitHub monorepo
2. **Save** commits under `spaces/{slug}/`
3. **`PublishService.publishSpace`** renders MD→HTML and updates the publish store
4. **`GithubGitHostingAdapter`** pushes branch `notes/{slug}/{userId}` and opens/updates a PR to `main`
5. UI shows “Saved & published” and a PR link

GitHub sync is **required** — the API will not start without `NOTES_GITHUB_REPO` and `NOTES_GITHUB_TOKEN`.

## Admin setup

| Variable | Purpose |
|----------|---------|
| `NOTES_GITHUB_REPO` | `owner/repo` — **required** |
| `NOTES_GITHUB_TOKEN` | Token with repo push + PR scope — **required** |
| `NOTES_GITHUB_BASE_BRANCH` | PR target (default `main`) |
| `NOTES_CONTENT_REPO_PATH` | Local clone path (default `./data/content-repo`) |
| `NOTES_PUBLISH_STORAGE_DIR` / S3 vars | Published read plane |

Initialize the GitHub repo with at least one commit on the base branch (e.g. empty `README.md` and `spaces/` directory) before first API start.

## Create space

UI form → `POST /api/spaces` with `{ slug, title, departmentSlug? }`.

API creates registry row, seeds `spaces/{slug}/` from the space template, commits, publishes, and syncs to GitHub.

## Contracts

- `src/contracts/space-manifest.v1.ts`
- `src/contracts/publish-manifest.v1.ts`
- `src/contracts/space-published.v1.ts`

## Future

- Gitea adapter (same `GitHostingPort`)
- Postgres registry, WebSocket editing presence, full-text search index
