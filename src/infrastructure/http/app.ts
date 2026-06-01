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

  api.get('/folders', async (c) => {
    const tree = await deps.notes.listFolderTree(c.get('user'));
    return c.json(tree);
  });

  api.post('/folders', async (c) => {
    const body = await c.req.json<{ name: string; parentId?: string | null }>();
    const folder = await deps.notes.createFolder(c.get('user'), body);
    return c.json(folder, 201);
  });

  api.patch('/folders/:id', async (c) => {
    const body = await c.req.json<{
      name?: string;
      parentId?: string | null;
      position?: number;
    }>();
    const folder = await deps.notes.updateFolder(c.get('user'), c.req.param('id'), body);
    return c.json(folder);
  });

  api.delete('/folders/:id', async (c) => {
    await deps.notes.deleteFolder(c.get('user'), c.req.param('id'));
    return c.body(null, 204);
  });

  api.patch('/folders/:id/pages/order', async (c) => {
    const body = await c.req.json<{ pageIds: string[] }>();
    if (!Array.isArray(body.pageIds)) {
      throw new ValidationError('pageIds must be an array');
    }
    const pages = await deps.notes.reorderPages(
      c.get('user'),
      c.req.param('id'),
      body.pageIds,
    );
    return c.json(pages);
  });

  api.get('/folders/:id/pages', async (c) => {
    const q = c.req.query('q');
    const pages = q
      ? await deps.notes.searchPages(c.get('user'), c.req.param('id'), q)
      : await deps.notes.listPages(c.get('user'), c.req.param('id'));
    return c.json(pages);
  });

  api.get('/folders/:folderId/pages/search', async (c) => {
    const q = c.req.query('q') ?? '';
    const pages = await deps.notes.searchPages(
      c.get('user'),
      c.req.param('folderId'),
      q,
    );
    return c.json(pages);
  });

  api.post('/pages', async (c) => {
    const body = await c.req.json<{ folderId: string; title?: string }>();
    const page = await deps.notes.createPage(c.get('user'), body);
    return c.json(page, 201);
  });

  api.get('/pages/:id', async (c) => {
    const page = await deps.notes.getPage(c.get('user'), c.req.param('id'));
    return c.json(page);
  });

  api.put('/pages/:id', async (c) => {
    const body = await c.req.json<{
      version: number;
      title?: string;
      contentJson?: string;
    }>();
    if (body.version === undefined) {
      throw new ValidationError('version is required');
    }
    const page = await deps.notes.updatePage(
      c.get('user'),
      c.req.param('id'),
      body.version,
      { title: body.title, contentJson: body.contentJson },
    );
    return c.json(page);
  });

  api.delete('/pages/:id', async (c) => {
    await deps.notes.deletePage(c.get('user'), c.req.param('id'));
    return c.body(null, 204);
  });

  api.post('/pages/:id/attachments', async (c) => {
    const form = await c.req.parseBody();
    const file = form['file'];
    if (!file || typeof file === 'string') {
      throw new ValidationError('file is required');
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await deps.notes.uploadAttachment(c.get('user'), c.req.param('id'), {
      mimeType: file.type || 'application/octet-stream',
      originalFilename: file.name || 'upload',
      data: buffer,
    });
    return c.json({ id: result.attachment.id, url: result.url }, 201);
  });

  api.get('/attachments/:id/content', async (c) => {
    const { data, mimeType } = await deps.notes.getAttachmentContent(
      c.get('user'),
      c.req.param('id'),
    );
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': mimeType },
    });
  });

  api.get('/pages/:id/export/markdown', async (c) => {
    const page = await deps.notes.getPage(c.get('user'), c.req.param('id'));
    const md = deps.notes.exportPageMarkdown(page);
    const filename = `${page.title.replace(/[^\w.-]+/g, '_') || 'page'}.md`;
    return new Response(md, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  });

  app.route('/api', api);

  return app;
}
