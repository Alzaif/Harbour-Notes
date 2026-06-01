# Contracts

Stable outward-facing shapes for plugins and satellite services. Version carefully.

- `events/` — integration event schemas (JSON Schema or TypeScript types + docs)
- `api/` — optional OpenAPI fragments for shell BFF endpoints

Other repos may copy types from here or consume published schemas — they must not import `src/domain` internals.
