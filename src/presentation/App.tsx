import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { api } from './api/client.js';
import type { PageRef, PublishStatus, PublishedPage, SourcePage, Space } from './api/types.js';
import { HarbourAppBar } from './components/HarbourAppBar.js';
import { SpaceSidebar } from './components/SpaceSidebar.js';
import { PageToolbar } from './components/PageToolbar.js';
import { CommentsPanel } from './components/CommentsPanel.js';
import { Breadcrumbs } from './components/Breadcrumbs.js';
import { RichTextEditor } from './components/RichTextEditor.js';
import { NotesHomePage } from './components/NotesHomePage.js';
import { SpaceOverviewPage } from './components/SpaceOverviewPage.js';
import { findPageInTree, getPageAncestors } from './utils/page-tree.js';

const shellUrl = import.meta.env.VITE_HARBOUR_SHELL_URL ?? 'https://harbour.local';

function NotesShell() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [tree, setTree] = useState<PageRef[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const navigate = useNavigate();
  const { spaceId, pageId } = useParams<{ spaceId?: string; pageId?: string }>();

  const selectedSpace = useMemo(
    () => spaces.find((space) => space.id === spaceId) ?? null,
    [spaces, spaceId],
  );

  const loadSpaces = useCallback(async () => {
    const list = await api.listSpaces();
    setSpaces(list);
    return list;
  }, []);

  const refreshTree = useCallback(async (id: string) => {
    const next = await api.getSpaceTree(id);
    setTree(next);
    return next;
  }, []);

  useEffect(() => {
    void loadSpaces().catch((e: Error) => setError(e.message));
  }, [loadSpaces]);

  useEffect(() => {
    if (!spaceId) {
      setTree([]);
      return;
    }
    void refreshTree(spaceId).catch((e: Error) => setError(e.message));
  }, [spaceId, refreshTree]);

  const handleCreateSpace = async () => {
    const title = window.prompt('Space title');
    if (!title?.trim()) return;
    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    try {
      const space = await api.createSpace({ slug, title: title.trim() });
      await loadSpaces();
      navigate(`/spaces/${space.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create space');
    }
  };

  const handleCreatePage = async (parentPageId?: string | null) => {
    if (!spaceId) return;
    const title = window.prompt('Page title');
    if (!title?.trim()) return;
    const pageIdInput = window.prompt('Page id (slug)', title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    if (!pageIdInput?.trim()) return;
    try {
      const status = await api.getPublishStatus(spaceId);
      const created = await api.createPage(spaceId, {
        pageId: pageIdInput.trim(),
        title: title.trim(),
        parentPageId: parentPageId ?? null,
        contentMarkdown: '',
        baseSha: status.headGitSha,
      });
      await refreshTree(spaceId);
      navigate(`/spaces/${spaceId}/pages/${created.pageId}?mode=edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create page');
    }
  };

  return (
    <div className="wiki-app">
      <HarbourAppBar homeUrl={shellUrl} appName="Notes" />
      {error && (
        <div className="wiki-banner wiki-banner--error" role="alert">
          <span>{error}</span>
          <button type="button" className="wiki-btn wiki-btn--subtle wiki-btn--small" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}
      <div className="wiki-body">
        <SpaceSidebar
          spaces={spaces}
          selectedSpace={selectedSpace}
          tree={tree}
          selectedPageId={pageId ?? null}
          onSelectSpace={(id) => navigate(`/spaces/${id}`)}
          onSelectPage={(pid) => spaceId && navigate(`/spaces/${spaceId}/pages/${pid}`)}
          onCreateSpace={() => void handleCreateSpace()}
          onCreatePage={(parentId) => void handleCreatePage(parentId)}
          onShowOverview={() => spaceId && navigate(`/spaces/${spaceId}`)}
          onShowHome={() => navigate('/spaces')}
          isHome={!spaceId}
        />
        <div className="wiki-workspace">
          <div className="wiki-workspace__column">
            {spaceId && pageId ? (
              <PageView
                spaceId={spaceId}
                pageId={pageId}
                space={selectedSpace}
                tree={tree}
                commentsOpen={commentsOpen}
                onToggleComments={() => setCommentsOpen((open) => !open)}
                onTreeChange={() => void refreshTree(spaceId)}
              />
            ) : selectedSpace ? (
              <SpaceOverviewPage
                space={selectedSpace}
                tree={tree}
                onSelectPage={(pid) => navigate(`/spaces/${spaceId}/pages/${pid}`)}
                onCreatePage={() => void handleCreatePage(null)}
              />
            ) : (
              <NotesHomePage
                spaces={spaces}
                onSelectSpace={(id) => navigate(`/spaces/${id}`)}
                onCreateSpace={() => void handleCreateSpace()}
              />
            )}
          </div>
          {commentsOpen && spaceId && pageId && (
            <CommentsPanel onClose={() => setCommentsOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

function PageView({
  spaceId,
  pageId,
  space,
  tree,
  commentsOpen,
  onToggleComments,
  onTreeChange,
}: {
  spaceId: string;
  pageId: string;
  space: Space | null;
  tree: readonly PageRef[];
  commentsOpen: boolean;
  onToggleComments: () => void;
  onTreeChange: () => void;
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'view' | 'edit'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'edit' ? 'edit' : 'view';
  });
  const [published, setPublished] = useState<PublishedPage | null>(null);
  const [source, setSource] = useState<SourcePage | null>(null);
  const [status, setStatus] = useState<PublishStatus | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageRef = findPageInTree(tree, pageId);
  const ancestors = getPageAncestors(tree, pageId);

  const refreshStatus = useCallback(async () => {
    const s = await api.getPublishStatus(spaceId);
    setStatus(s);
    setPrUrl(s.prUrl);
  }, [spaceId]);

  const loadPublished = useCallback(async () => {
    const page = await api.getPublishedPage(spaceId, pageId);
    setPublished(page);
    setError(null);
  }, [spaceId, pageId]);

  const loadSource = useCallback(async () => {
    const page = await api.getSourcePage(spaceId, pageId);
    setSource(page);
    setDraftTitle(page.title);
    setDraftBody(page.contentMarkdown);
    setError(null);
  }, [spaceId, pageId]);

  useEffect(() => {
    void refreshStatus().catch(() => {});
  }, [refreshStatus, source?.gitSha]);

  useEffect(() => {
    if (mode === 'view') {
      void loadPublished().catch((e: Error) => {
        setError(e.message);
        setPublished(null);
      });
    } else {
      void loadSource().catch((e: Error) => setError(e.message));
    }
  }, [mode, loadPublished, loadSource]);

  const setModeAndUrl = (next: 'view' | 'edit') => {
    setMode(next);
    const url = new URL(window.location.href);
    if (next === 'edit') url.searchParams.set('mode', 'edit');
    else url.searchParams.delete('mode');
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  const save = async () => {
    if (!source) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const updated = await api.commitPage(spaceId, pageId, {
        baseSha: source.gitSha,
        title: draftTitle,
        contentMarkdown: draftBody,
      });
      setSource(updated);
      setSaveMessage('Saved & published');
      setPrUrl(updated.prUrl);
      await refreshStatus();
      onTreeChange();
      void loadPublished().catch(() => {});
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Save failed';
      setError(message);
      if (message.includes('base revision mismatch')) {
        void loadSource().catch(() => {});
      }
    } finally {
      setSaving(false);
    }
  };

  const publishLabel = status
    ? status.isPublished
      ? status.publishedAt
        ? `Published ${formatRelativeTime(status.publishedAt)}`
        : 'Published'
      : 'Publishing…'
    : '';

  const breadcrumbSegments = [
    ...(space
      ? [{ label: space.title, onClick: () => navigate(`/spaces/${spaceId}`) }]
      : []),
    ...ancestors.map((node) => ({
      label: node.title,
      onClick: () => navigate(`/spaces/${spaceId}/pages/${node.pageId}`),
    })),
    { label: pageRef?.title ?? pageId },
  ];

  const handleImageUpload = async (_file: File) => {
    const url = window.prompt('Image URL (asset path or https://…)');
    return url?.trim() ?? '';
  };

  return (
    <>
      <PageToolbar
        mode={mode}
        publishLabel={publishLabel}
        prUrl={prUrl}
        commentsOpen={commentsOpen}
        canEdit
        saving={saving}
        onModeChange={setModeAndUrl}
        onSave={() => void save()}
        onToggleComments={onToggleComments}
      />
      <main className="wiki-main">
        <article className="wiki-page">
          <div className="wiki-page__inner">
            <Breadcrumbs segments={breadcrumbSegments} />
            {mode === 'edit' ? (
              <input
                className="wiki-page__title"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Untitled"
                aria-label="Page title"
              />
            ) : (
              <h1 className="wiki-page__title-static">
                {published?.title ?? pageRef?.title ?? pageId}
              </h1>
            )}
            {(saveMessage || error) && (
              <div className="wiki-page__meta">
                {saveMessage && <span className="wiki-page__save">{saveMessage}</span>}
                {error && <span className="wiki-page__error">{error}</span>}
              </div>
            )}
            {mode === 'view' ? (
              published ? (
                <div
                  className="wiki-page__content wiki-page__content--html"
                  dangerouslySetInnerHTML={{ __html: published.body }}
                />
              ) : (
                <p className="wiki-main__empty-text">
                  Not published yet. Switch to Edit and save to publish this page.
                </p>
              )
            ) : (
              source && (
                <RichTextEditor
                  contentMarkdown={draftBody}
                  onMarkdownChange={setDraftBody}
                  onImageUpload={handleImageUpload}
                  editable
                />
              )
            )}
          </div>
        </article>
      </main>
    </>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <Routes>
        <Route path="/" element={<Navigate to="/spaces" replace />} />
        <Route path="/spaces" element={<NotesShell />} />
        <Route path="/spaces/:spaceId" element={<NotesShell />} />
        <Route path="/spaces/:spaceId/pages/:pageId" element={<NotesShell />} />
      </Routes>
    </BrowserRouter>
  );
}
