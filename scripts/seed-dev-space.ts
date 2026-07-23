#!/usr/bin/env npx tsx
/** Creates engineering space with auto-publish for local dev. */
import { createNotesDependencies } from '../src/bootstrap/create-notes-dependencies.js';

const deps = await createNotesDependencies({
  ...process.env,
  TRUST_GATEWAY_HEADERS: 'false',
  DEV_USER_ID: process.env.DEV_USER_ID ?? 'dev-user',
  DEV_USER_EMAIL: process.env.DEV_USER_EMAIL ?? 'dev@example.com',
  DEV_USER_DISPLAY_NAME: process.env.DEV_USER_DISPLAY_NAME ?? 'Dev User',
});

const user = await deps.users.upsertFromGateway({
  id: process.env.DEV_USER_ID ?? 'dev-user',
  email: process.env.DEV_USER_EMAIL ?? 'dev@example.com',
  displayName: process.env.DEV_USER_DISPLAY_NAME ?? 'Dev User',
});

const existing = await deps.spaces.listSpaces(user);
if (existing.some((s) => s.slug === 'engineering')) {
  console.log('Engineering space already exists');
  process.exit(0);
}

const space = await deps.spaces.createSpace(user, {
  slug: 'engineering',
  title: 'Engineering',
});
console.log(`Created space ${space.slug} (${space.id}) — content is published automatically on save`);
