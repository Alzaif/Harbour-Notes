import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createNotesDependencies } from '../../src/bootstrap/create-notes-dependencies.js';
import { createApp } from '../../src/infrastructure/http/app.js';
import { GATEWAY_HEADERS } from '../../src/contracts/gateway-headers.v1.js';

export async function createTestApp(user: {
  id: string;
  email: string;
  displayName?: string;
}) {
  const dir = mkdtempSync(join(tmpdir(), 'harbour-notes-test-'));
  const deps = await createNotesDependencies({
    ...process.env,
    NODE_ENV: 'test',
    TRUST_GATEWAY_HEADERS: 'false',
    DEV_USER_ID: user.id,
    DEV_USER_EMAIL: user.email,
    DEV_USER_DISPLAY_NAME: user.displayName ?? user.id,
    NOTES_DB_PATH: join(dir, 'test.db'),
    NOTES_DATA_DIR: dir,
  });
  const app = createApp(deps);
  const headers = {
    [GATEWAY_HEADERS.userId]: user.id,
    [GATEWAY_HEADERS.email]: user.email,
    ...(user.displayName
      ? { [GATEWAY_HEADERS.displayName]: user.displayName }
      : {}),
  };
  return { app, deps, headers, dataDir: dir };
}
