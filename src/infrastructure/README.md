# Infrastructure

Adapters for external systems. Implements domain/application ports.

- `adapters/` — HTTP clients, OIDC, file-based registry loaders
- `messaging/` — event bus implementations (in-memory, future NATS/Redis/etc.)

Map external DTOs to domain types here; do not leak DTOs into domain.
