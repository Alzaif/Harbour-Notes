# Design documentation

Repo-specific design material for **harbour-platform-ui**: how this codebase is structured, how flows work, and how it connects to the wider Harbour platform.

## Rules

1. **Context first** — Every diagram, screenshot, or asset must live inside a markdown document (or be linked from one) that explains purpose, scope, and how to read it.
2. **No orphan files** — Do not commit bare `.png`, `.svg`, or `.drawio` files without a parent `.md` that references and describes them.
3. **Prefer text diagrams** — Use [Mermaid](https://mermaid.js.org/) in markdown where possible so diffs stay reviewable.
4. **Stay current** — When behaviour changes, update the design doc in the same PR or open a follow-up immediately.

## Suggested topics for this repo

- Shell layout and navigation UX contract  
- Service launcher flow (redirect, not iframe)  
- Auth state in the UI vs gateway  
- Composition root / port wiring in `src/bootstrap/`

## Related documents

- [Platform technical design](../../harbour-technical-design.md) — phased roadmap (all of Harbour)  
- [HEPs](../heps/) — numbered proposals for significant decisions  
- [AGENTS.md](../../AGENTS.md) — where code belongs in the hexagonal layout
