import type {
  PageRef,
  PageSaveResult,
  PublishStatus,
  PublishedPage,
  SourcePage,
  Space,
} from './types.js';
import { apiUrl } from './app-path.js';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listSpaces: () => request<Space[]>('/api/spaces'),
  createSpace: (body: {
    slug: string;
    title: string;
    departmentSlug?: string | null;
    s3Prefix?: string;
  }) => request<Space>('/api/spaces', { method: 'POST', body: JSON.stringify(body) }),
  getSpaceTree: (spaceId: string) => request<PageRef[]>(`/api/spaces/${spaceId}/tree`),
  getPublishedPage: (spaceId: string, pageId: string) =>
    request<PublishedPage>(`/api/spaces/${spaceId}/pages/${pageId}/published`),
  getSourcePage: (spaceId: string, pageId: string) =>
    request<SourcePage>(`/api/spaces/${spaceId}/pages/${pageId}/source`),
  commitPage: (
    spaceId: string,
    pageId: string,
    body: { baseSha: string; title: string; contentMarkdown: string },
  ) =>
    request<PageSaveResult>(`/api/spaces/${spaceId}/pages/${pageId}/source`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  createPage: (
    spaceId: string,
    body: {
      pageId: string;
      title: string;
      parentPageId?: string | null;
      contentMarkdown?: string;
      baseSha: string;
    },
  ) =>
    request<PageSaveResult>(`/api/spaces/${spaceId}/pages`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getPublishStatus: (spaceId: string) =>
    request<PublishStatus>(`/api/spaces/${spaceId}/publish/status`),
  getPullRequestUrl: (spaceId: string) =>
    request<{ prUrl: string | null }>(`/api/spaces/${spaceId}/git/pr`),
};
