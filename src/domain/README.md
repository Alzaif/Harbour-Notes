# Domain

Core model and rules. No framework or I/O imports.

- `entities/` — business objects (e.g. `HarbourService`, `UserSession`)
- `events/` — domain events raised inside the model
- `ports/` — outbound interfaces (repositories, publishers) implemented in infrastructure
- `value-objects/` — small immutable types
