# Application

Use cases and inbound port interfaces. Orchestrates domain logic.

- `use-cases/` — one file per flow (e.g. `listServices`, `launchService`)
- `ports/` — inbound interfaces consumed by presentation (e.g. `ServiceLauncher`)

Use cases accept ports via constructor or factory parameters — never concrete adapters.
