import { Hono } from 'hono';
import type { NotesDependencies } from '../../bootstrap/create-notes-dependencies.js';
import type { AppVariables } from './gateway-identity.js';
import { createGatewayIdentityMiddleware } from './gateway-identity.js';
import { handleError } from './error-handler.js';
import { ValidationError } from '../../shared/errors.js';

export function createApp(deps: NotesDependencies) {
  const app = new Hono();

  app.onError((err, c) => handleError(err, c));

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.get('/version', (c) =>
    c.json({
      name: deps.config.PACKAGE_NAME,
      version: deps.config.PACKAGE_VERSION,
    }),
  );

  const api = new Hono<{ Variables: AppVariables }>();
  api.use('*', createGatewayIdentityMiddleware(deps.config, deps.users));

  api.get('/spaces', async (c) => {
    const list = await deps.spaces.listSpaces(c.get('user'));
    return c.json(list);
  });

  api.post('/spaces', async (c) => {
    const body = await c.req.json<{
      slug: string;
      title: string;
      departmentSlug?: string | null;
      s3Prefix?: string;
    }>();
    if (!body.slug?.trim() || !body.title?.trim()) {
      throw new ValidationError('slug and title are required');
    }
    const space = await deps.spaces.createSpace(c.get('user'), {
      slug: body.slug.trim(),
      title: body.title.trim(),
      departmentSlug: body.departmentSlug ?? null,
      s3Prefix: body.s3Prefix,
    });
    return c.json(space, 201);
  });

  api.get('/spaces/:spaceId/tree', async (c) => {
    const tree = await deps.spaces.getSpaceTree(c.get('user'), c.req.param('spaceId'));
    return c.json(tree);
  });

  api.get('/spaces/:spaceId/pages/:pageId/published', async (c) => {
    const page = await deps.pages.getPublishedPage(
      c.get('user'),
      c.req.param('spaceId'),
      c.req.param('pageId'),
    );
    return c.json(page);
  });

  api.get('/spaces/:spaceId/pages/:pageId/source', async (c) => {
    const page = await deps.pages.getSourcePage(
      c.get('user'),
      c.req.param('spaceId'),
      c.req.param('pageId'),
    );
    return c.json(page);
  });

  api.put('/spaces/:spaceId/pages/:pageId/source', async (c) => {
    const body = await c.req.json<{
      baseSha: string;
      title: string;
      contentMarkdown: string;
    }>();
    if (!body.baseSha || body.title === undefined || body.contentMarkdown === undefined) {
      throw new ValidationError('baseSha, title, and contentMarkdown are required');
    }
    const page = await deps.pages.commitPage(
      c.get('user'),
      c.req.param('spaceId'),
      c.req.param('pageId'),
      body,
    );
    return c.json(page);
  });

  api.post('/spaces/:spaceId/pages', async (c) => {
    const body = await c.req.json<{
      pageId: string;
      title: string;
      parentPageId?: string | null;
      contentMarkdown?: string;
      baseSha: string;
    }>();
    if (!body.pageId?.trim() || !body.title?.trim() || !body.baseSha) {
      throw new ValidationError('pageId, title, and baseSha are required');
    }
    const page = await deps.pages.createPage(c.get('user'), c.req.param('spaceId'), {
      pageId: body.pageId.trim(),
      title: body.title.trim(),
      parentPageId: body.parentPageId ?? null,
      contentMarkdown: body.contentMarkdown,
      baseSha: body.baseSha,
    });
    return c.json(page, 201);
  });

  api.get('/spaces/:spaceId/publish/status', async (c) => {
    const status = await deps.publish.getPublishStatus(c.get('user'), c.req.param('spaceId'));
    return c.json(status);
  });

  api.get('/spaces/:spaceId/git/pr', async (c) => {
    const result = await deps.publish.getPullRequestUrl(c.get('user'), c.req.param('spaceId'));
    return c.json(result);
  });

  api.post('/spaces/:spaceId/publish/callback', async (c) => {
    const secret = c.req.header('X-Notes-Publish-Secret');
    const body = await c.req.json();
    await deps.publish.recordPublishCallback(body, secret);
    return c.body(null, 204);
  });

  app.route('/api', api);
  return app;
}
