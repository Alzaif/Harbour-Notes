# Documentation

| Path | Purpose |
|------|---------|
| [heps/](./heps/) | **Harbour Enhancement Proposals** — cross-repo or significant technical decisions (PEP-style) |
| [design/](./design/) | Repo-specific design notes, diagrams with explanatory context |
| [../harbour-technical-design.md](../harbour-technical-design.md) | Platform-wide phased technical design |
| [../AGENTS.md](../AGENTS.md) | Architecture and agent conventions |

## When to use what

- **Technical design** (repo root) — long-lived platform roadmap and phases; rarely forked per service.
- **HEP** — a proposal that needs review, a number, status, and a record of *why* a choice was made (registry format, event bus, breaking contract change).
- **Design** — how *this repository* implements something today: flows, component boundaries, deployment notes. Every diagram lives inside a markdown document that explains it.

Do not add standalone diagram files under `design/` without an accompanying markdown document.
