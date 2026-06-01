import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api/client.js';
import type { FolderTreeNode, Page, PageSummary } from './api/types.js';
import { Breadcrumbs } from './components/Breadcrumbs.js';
import { RichTextEditor } from './components/RichTextEditor.js';
import { HarbourAppBar } from './components/HarbourAppBar.js';
import { WikiSidebar } from './components/WikiSidebar.js';
import { EMPTY_DOC_JSON } from '../shared/extract-plain-text.js';
import { contentJsonEquals } from '../shared/normalize-content-json.js';
import { findFolderPath, flattenFolders } from './utils/folder-tree.js';

const shellUrl = import.meta.env.VITE_HARBOUR_SHELL_URL ?? 'https://harbour.local';

export function App() {
  const [folders, setFolders] = useState<FolderTreeNode[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [pagesByFolder, setPagesByFolder] = useState<Record<string, PageSummary[]>>({});
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ title?: string; contentJson?: string } | null>(null);
  const savedBaseline = useRef<{
    pageId: string;
    title: string;
    contentJson: string;
  } | null>(null);

  const loadFolders = useCallback(async () => {
    const tree = await api.listFolders();
    setFolders(tree);
    const flat = flattenFolders(tree);
    const entries = await Promise.all(
      flat.map(async (f) => {
        const pages = await api.listPages(f.id);
        return [f.id, pages] as const;
      }),
    );
    setPagesByFolder(Object.fromEntries(entries));
    setSelectedSpaceId((prev) => prev ?? tree[0]?.id ?? null);
    setSelectedFolderId((prev) => prev ?? tree[0]?.id ?? null);
    return tree;
  }, []);

  const refreshFolderPages = useCallback(async (folderId: string) => {
    const pages = await api.listPages(folderId);
    setPagesByFolder((prev) => ({ ...prev, [folderId]: pages }));
  }, []);

  const loadPage = useCallback(async (id: string) => {
    const p = await api.getPage(id);
    setPage(p);
    setSelectedFolderId(p.folderId);
    const spaceId = findSpaceIdForFolder(folders, p.folderId);
    if (spaceId) setSelectedSpaceId(spaceId);
  }, [folders]);

  useEffect(() => {
    void loadFolders().catch((e: Error) => setError(e.message));
  }, [loadFolders]);

  useEffect(() => {
    if (!selectedPageId) {
      setPage(null);
      savedBaseline.current = null;
      return;
    }
    loadPage(selectedPageId).catch((e: Error) => setError(e.message));
  }, [selectedPageId, loadPage]);

  useEffect(() => {
    if (!page) return;
    savedBaseline.current = {
      pageId: page.id,
      title: page.title,
      contentJson: page.contentJson || EMPTY_DOC_JSON,
    };
    pendingSave.current = null;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  }, [page?.id, page?.version]);

  const flushSave = useCallback(async () => {
    if (!page || !pendingSave.current) return;
    const base = savedBaseline.current;
    const patch = pendingSave.current;
    const nextTitle = patch.title ?? page.title;
    const nextContent = patch.contentJson ?? page.contentJson ?? EMPTY_DOC_JSON;

    const hasChange =
      !base ||
      base.pageId !== page.id ||
      (patch.title !== undefined && nextTitle !== base.title) ||
      (patch.contentJson !== undefined &&
        !contentJsonEquals(nextContent, base.contentJson));

    if (!hasChange) {
      pendingSave.current = null;
      return;
    }

    pendingSave.current = null;
    setSaveStatus('Saving…');
    try {
      const updated = await api.updatePage(page.id, {
        version: page.version,
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.contentJson !== undefined ? { contentJson: patch.contentJson } : {}),
      });
      setPage(updated);
      savedBaseline.current = {
        pageId: updated.id,
        title: updated.title,
        contentJson: updated.contentJson || EMPTY_DOC_JSON,
      };
      setSaveStatus('Saved');
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 409) {
        setError('Someone else updated this page. Reload to continue.');
      } else {
        setError(err.message);
      }
      setSaveStatus('');
    }
  }, [page, refreshFolderPages]);

  const scheduleSave = useCallback(
    (patch: { title?: string; contentJson?: string }) => {
      pendingSave.current = { ...pendingSave.current, ...patch };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void flushSave();
      }, 800);
    },
    [flushSave],
  );

  const handleCreateFolder = async (parentId: string | null) => {
    const name = window.prompt('Folder name');
    if (!name) return;
    try {
      await api.createFolder({ name, parentId });
      await loadFolders();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleCreateSpace = async () => {
    const name = window.prompt('Space name');
    if (!name) return;
    try {
      const space = await api.createFolder({ name, parentId: null });
      await loadFolders();
      setSelectedSpaceId(space.id);
      setSelectedFolderId(space.id);
      setSelectedPageId(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleCreatePage = async (folderId: string) => {
    if (!folderId) return;
    try {
      const created = await api.createPage({ folderId });
      await refreshFolderPages(folderId);
      setSelectedFolderId(folderId);
      setSelectedPageId(created.id);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleSelectPage = async (id: string, folderId: string) => {
    if (id === selectedPageId) return;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (page && pendingSave.current) {
      await flushSave();
    }
    setSelectedFolderId(folderId);
    setSelectedPageId(id);
  };

  const handleReorderPages = async (folderId: string, pageIds: string[]) => {
    try {
      const ordered = await api.reorderPages(folderId, pageIds);
      setPagesByFolder((prev) => ({ ...prev, [folderId]: ordered }));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDeletePage = async () => {
    if (!page || !window.confirm(`Delete "${page.title}"?`)) return;
    try {
      await api.deletePage(page.id);
      setSelectedPageId(null);
      setPage(null);
      await refreshFolderPages(page.folderId);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!page) throw new Error('No page selected');
    const { url } = await api.uploadAttachment(page.id, file);
    return url;
  };

  const breadcrumbSegments = useMemo(() => {
    if (!page) return [];
    const folderPath = findFolderPath(folders, page.folderId) ?? [];
    return [
      { label: 'Notes', onClick: () => setSelectedPageId(null) },
      ...folderPath.map((seg, i) => ({
        label: seg.name,
        onClick:
          i < folderPath.length - 1
            ? () => {
                setSelectedPageId(null);
                setSelectedFolderId(seg.id);
              }
            : () => {
                setSelectedPageId(null);
                setSelectedFolderId(seg.id);
              },
      })),
      { label: page.title || 'Untitled' },
    ];
  }, [page, folders]);

  const defaultFolderId = selectedFolderId ?? folders[0]?.id ?? '';
  const currentSpaceFolders = useMemo(() => {
    if (!selectedSpaceId) return [];
    const space = folders.find((f) => f.id === selectedSpaceId);
    return space ? [space] : [];
  }, [folders, selectedSpaceId]);

  return (
    <div className="wiki-app">
      <HarbourAppBar homeUrl={shellUrl} appName="Notes" />

      {error && (
        <div className="wiki-banner wiki-banner--error" role="alert">
          <span>{error}</span>
          <button type="button" className="wiki-btn wiki-btn--subtle" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="wiki-body">
        <WikiSidebar
          spaces={folders}
          selectedSpaceId={selectedSpaceId}
          folders={currentSpaceFolders}
          pagesByFolder={pagesByFolder}
          selectedFolderId={selectedFolderId}
          selectedPageId={selectedPageId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectSpace={(id) => {
            setSelectedSpaceId(id);
            setSelectedFolderId(id);
            setSelectedPageId(null);
          }}
          onSelectFolder={setSelectedFolderId}
          onSelectPage={(id, folderId) => void handleSelectPage(id, folderId)}
          onReorderPages={handleReorderPages}
          onCreateSpace={handleCreateSpace}
          onCreateFolder={handleCreateFolder}
          onCreatePage={handleCreatePage}
          onRenameFolder={(id, name) =>
            api.updateFolder(id, { name }).then(loadFolders).catch((e: Error) => setError(e.message))
          }
        />

        <main className="wiki-main">
          {page ? (
            <article className="wiki-page">
              <div className="wiki-page__inner">
                <Breadcrumbs segments={breadcrumbSegments} />
                <div className="wiki-page__header">
                  <input
                    className="wiki-page__title"
                    value={page.title}
                    placeholder="Page title"
                    aria-label="Page title"
                    onChange={(e) => {
                      const title = e.target.value;
                      setPage({ ...page, title });
                      scheduleSave({ title });
                    }}
                  />
                  <div className="wiki-page__meta">
                    <span>
                      Updated {new Date(page.updatedAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span className="wiki-page__meta-sep">·</span>
                    <span>Version {page.version}</span>
                    {saveStatus && (
                      <>
                        <span className="wiki-page__meta-sep">·</span>
                        <span className="wiki-page__save">{saveStatus}</span>
                      </>
                    )}
                  </div>
                  <div className="wiki-page__actions">
                    <button type="button" className="wiki-btn" onClick={() => api.exportMarkdown(page.id)}>
                      Export Markdown
                    </button>
                    <button type="button" className="wiki-btn wiki-btn--danger" onClick={handleDeletePage}>
                      Delete page
                    </button>
                  </div>
                </div>
                <RichTextEditor
                  contentJson={page.contentJson || EMPTY_DOC_JSON}
                  onChange={(contentJson) => {
                    setPage({ ...page, contentJson });
                    scheduleSave({ contentJson });
                  }}
                  onImageUpload={handleImageUpload}
                />
              </div>
            </article>
          ) : (
            <div className="wiki-main__empty">
              <h1>Welcome to Notes</h1>
              <p>Select a page from the tree, or create one to start writing.</p>
              {defaultFolderId && (
                <button
                  type="button"
                  className="wiki-btn wiki-btn--primary"
                  onClick={() => handleCreatePage(defaultFolderId)}
                >
                  Create a page
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function findSpaceIdForFolder(tree: FolderTreeNode[], folderId: string): string | null {
  for (const space of tree) {
    if (space.id === folderId) return space.id;
    if (containsFolder(space.children, folderId)) return space.id;
  }
  return null;
}

function containsFolder(nodes: FolderTreeNode[], folderId: string): boolean {
  for (const node of nodes) {
    if (node.id === folderId) return true;
    if (containsFolder(node.children, folderId)) return true;
  }
  return false;
}
