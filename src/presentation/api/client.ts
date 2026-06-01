import type { FolderTreeNode, Page, PageSummary } from './types.js';

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    const err = new Error(body.error ?? res.statusText) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listFolders: () => request<FolderTreeNode[]>('/api/folders'),

  createFolder: (body: { name: string; parentId?: string | null }) =>
    request<FolderTreeNode>('/api/folders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateFolder: (
    id: string,
    body: { name?: string; parentId?: string | null; position?: number },
  ) =>
    request<FolderTreeNode>(`/api/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteFolder: (id: string) =>
    request<void>(`/api/folders/${id}`, { method: 'DELETE' }),

  listPages: (folderId: string, q?: string) => {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    return request<PageSummary[]>(`/api/folders/${folderId}/pages${params}`);
  },

  reorderPages: (folderId: string, pageIds: string[]) =>
    request<PageSummary[]>(`/api/folders/${folderId}/pages/order`, {
      method: 'PATCH',
      body: JSON.stringify({ pageIds }),
    }),

  createPage: (body: { folderId: string; title?: string }) =>
    request<Page>('/api/pages', { method: 'POST', body: JSON.stringify(body) }),

  getPage: (id: string) => request<Page>(`/api/pages/${id}`),

  updatePage: (
    id: string,
    body: { version: number; title?: string; contentJson?: string },
  ) =>
    request<Page>(`/api/pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deletePage: (id: string) =>
    request<void>(`/api/pages/${id}`, { method: 'DELETE' }),

  uploadAttachment: (pageId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<{ id: string; url: string }>(`/api/pages/${pageId}/attachments`, {
      method: 'POST',
      body: form,
    });
  },

  exportMarkdown: (pageId: string) => {
    window.location.assign(`/api/pages/${pageId}/export/markdown`);
  },
};
