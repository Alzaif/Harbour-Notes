# Presentation

React UI, routes, and view-specific hooks.

- `components/` — reusable UI
- `pages/` — route-level screens (home launcher, errors)
- `hooks/` — thin wrappers that invoke use cases

Do not call HTTP or OIDC libraries directly — go through application ports wired in `bootstrap/`.
