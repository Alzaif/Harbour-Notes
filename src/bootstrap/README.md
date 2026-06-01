# Bootstrap

Composition root: wire ports to adapters and expose facades to the React app.

Example responsibilities:

- Instantiate `InMemoryMessageBus` or future broker adapter
- Bind `ServiceRegistryPort` to file/HTTP adapter
- Provide context providers for presentation layer

Keep this folder free of business rules.
