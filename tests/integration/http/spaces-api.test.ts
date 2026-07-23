import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestApp } from '../../helpers/test-app.js';

describe('spaces API integration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates space, reads tree, commits page, syncs to GitHub, and auto-publishes', async () => {
    const { app, headers } = await createTestApp({
      id: 'user-1',
      email: 'user-1@example.com',
      displayName: 'User One',
    });

    const createRes = await app.request('/api/spaces', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'test-space',
        title: 'Test Space',
      }),
    });
    expect(createRes.status).toBe(201);
    const space = (await createRes.json()) as {
      id: string;
      slug: string;
      contentPath: string;
    };
    expect(space.contentPath).toBe('spaces/test-space');

    const treeRes = await app.request(`/api/spaces/${space.id}/tree`, { headers });
    expect(treeRes.status).toBe(200);
    const tree = (await treeRes.json()) as { pageId: string }[];
    expect(tree.length).toBeGreaterThan(0);

    const headRes = await app.request(`/api/spaces/${space.id}/pages/${tree[0]!.pageId}/source`, {
      headers,
    });
    const headSource = (await headRes.json()) as { gitSha: string };

    const createPageRes = await app.request(`/api/spaces/${space.id}/pages`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageId: 'new-page',
        title: 'New Page',
        parentPageId: tree[0]!.pageId,
        contentMarkdown: 'New content',
        baseSha: headSource.gitSha,
      }),
    });
    expect(createPageRes.status).toBe(201);
    const createdPage = (await createPageRes.json()) as { publishedAt: string; prUrl: string | null };
    expect(createdPage.publishedAt).toBeTruthy();
    expect(createdPage.prUrl).toContain('/pull/');

    const pageId = tree[0]!.pageId;
    const sourceRes = await app.request(`/api/spaces/${space.id}/pages/${pageId}/source`, {
      headers,
    });
    expect(sourceRes.status).toBe(200);
    const source = (await sourceRes.json()) as { gitSha: string };

    const commitRes = await app.request(`/api/spaces/${space.id}/pages/${pageId}/source`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseSha: source.gitSha,
        title: 'Updated',
        contentMarkdown: 'Updated body',
      }),
    });
    expect(commitRes.status).toBe(200);
    const committed = (await commitRes.json()) as {
      gitSha: string;
      publishedAt: string;
      prUrl: string | null;
    };
    expect(committed.publishedAt).toBeTruthy();
    expect(committed.prUrl).toContain('/pull/');

    const publishedRes = await app.request(
      `/api/spaces/${space.id}/pages/${pageId}/published`,
      { headers },
    );
    expect(publishedRes.status).toBe(200);
    const published = (await publishedRes.json()) as { body: string };
    expect(published.body).toContain('Updated');

    const statusRes = await app.request(`/api/spaces/${space.id}/publish/status`, { headers });
    expect(statusRes.status).toBe(200);
    const status = (await statusRes.json()) as { isPublished: boolean; prUrl: string | null };
    expect(status.isPublished).toBe(true);
    expect(status.prUrl).toContain('/pull/');
  });
});
