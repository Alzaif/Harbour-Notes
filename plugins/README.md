# Plugins

Optional **local** plugin manifests for development or family-specific extensions.

Production service entries should eventually live in configuration or a registry API (see technical design Phase 2.2). Plugins must not bypass SSO or the gateway.

## Manifest shape (draft)

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "entryUrl": "https://my-plugin.harbour.local",
  "description": "Short description",
  "events": {
    "publishes": ["harbour.example.v1"],
    "subscribes": []
  }
}
```

Place one JSON file per plugin. The shell loads these only when explicitly enabled in config.
