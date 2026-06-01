import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createTestApp } from '../../helpers/test-app.js';
import { createNotesDependencies } from '../../../src/bootstrap/create-notes-dependencies.js';
import { createApp } from '../../../src/infrastructure/http/app.js';

describe('Notes HTTP API', () => {
  it('returns health without auth', async () => {
    const { app } = await createTestApp({
      id: 'alice',
      email: 'alice@example.com',
    });
    const res = await app.request('/health');
    expect(res.status).toBe(200);
  });

  it('requires identity for /api', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'harbour-notes-unauth-'));
    const deps = await createNotesDependencies({
      NODE_ENV: 'test',
      TRUST_GATEWAY_HEADERS: 'true',
      NOTES_DB_PATH: join(dir, 'test.db'),
      NOTES_DATA_DIR: dir,
    });
    const app = createApp(deps);
    const res = await app.request('/api/folders');
    expect(res.status).toBe(401);
  });

  it('creates folder, page, uploads image, exports markdown', async () => {
    const { app, headers } = await createTestApp({
      id: 'alice',
      email: 'alice@example.com',
      displayName: 'Alice',
    });

    const folderRes = await app.request('/api/folders', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Home' }),
    });
    expect(folderRes.status).toBe(201);
    const folder = (await folderRes.json()) as { id: string };

    const pageRes = await app.request('/api/pages', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: folder.id, title: 'Welcome' }),
    });
    expect(pageRes.status).toBe(201);
    const page = (await pageRes.json()) as { id: string; version: number };

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    const form = new FormData();
    form.append(
      'file',
      new Blob([png], { type: 'image/png' }),
      'pixel.png',
    );
    const uploadRes = await app.request(`/api/pages/${page.id}/attachments`, {
      method: 'POST',
      headers,
      body: form,
    });
    expect(uploadRes.status).toBe(201);

    const mdRes = await app.request(`/api/pages/${page.id}/export/markdown`, {
      headers,
    });
    expect(mdRes.status).toBe(200);
    const md = await mdRes.text();
    expect(md).toContain('# Welcome');
  });

  it('isolates alice and bob', async () => {
    const alice = await createTestApp({
      id: 'alice',
      email: 'alice@example.com',
    });
    const bob = await createTestApp({
      id: 'bob',
      email: 'bob@example.com',
    });

    const create = await alice.app.request('/api/folders', {
      method: 'POST',
      headers: { ...alice.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Secret' }),
    });
    const folder = (await create.json()) as { id: string };
    await alice.app.request('/api/pages', {
      method: 'POST',
      headers: { ...alice.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: folder.id }),
    });

    const bobList = await bob.app.request('/api/folders', { headers: bob.headers });
    const bobFolders = (await bobList.json()) as unknown[];
    expect(bobFolders).toHaveLength(0);
  });

  it('returns 409 on version conflict', async () => {
    const { app, headers } = await createTestApp({
      id: 'alice',
      email: 'alice@example.com',
    });
    const folderRes = await app.request('/api/folders', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'F' }),
    });
    const folder = (await folderRes.json()) as { id: string };
    const pageRes = await app.request('/api/pages', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: folder.id }),
    });
    const page = (await pageRes.json()) as { id: string; version: number };

    const ok = await app.request(`/api/pages/${page.id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: page.version, title: 'A' }),
    });
    expect(ok.status).toBe(200);

    const conflict = await app.request(`/api/pages/${page.id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: page.version, title: 'B' }),
    });
    expect(conflict.status).toBe(409);
  });
});
