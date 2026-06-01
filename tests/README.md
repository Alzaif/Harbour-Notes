# Tests

- `unit/` — domain and application use cases (fast, no I/O)
- `integration/` — adapters with test doubles or local services
- `contract/` — schemas in `src/contracts/` and plugin manifests

Mirror `src/` folder names inside each test tier where helpful.
