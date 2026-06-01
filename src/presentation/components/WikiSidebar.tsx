import { useEffect, useMemo, useState } from 'react';
import type { FolderTreeNode, PageSummary } from '../api/types.js';

interface WikiSidebarProps {
  readonly spaces: FolderTreeNode[];
  readonly selectedSpaceId: string | null;
  readonly folders: FolderTreeNode[];
  readonly pagesByFolder: Readonly<Record<string, PageSummary[]>>;
  readonly selectedFolderId: string | null;
  readonly selectedPageId: string | null;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly onSelectFolder: (id: string) => void;
  readonly onSelectSpace: (id: string) => void;
  readonly onSelectPage: (id: string, folderId: string) => void;
  readonly onCreateSpace: () => void;
  readonly onCreateFolder: (parentId: string | null) => void;
  readonly onCreatePage: (folderId: string) => void;
  readonly onReorderPages: (folderId: string, pageIds: string[]) => void;
  readonly onRenameFolder?: (id: string, name: string) => void;
}

function pageMatchesSearch(page: PageSummary, query: string): boolean {
  if (!query.trim()) return true;
  return page.title.toLowerCase().includes(query.trim().toLowerCase());
}

function FolderBranch({
  node,
  depth,
  pagesByFolder,
  searchQuery,
  expanded,
  selectedFolderId,
  selectedPageId,
  onToggleExpand,
  onSelectFolder,
  onSelectPage,
  onCreateFolder,
  onCreatePage,
  onReorderPages,
}: {
  node: FolderTreeNode;
  depth: number;
  pagesByFolder: Readonly<Record<string, PageSummary[]>>;
  searchQuery: string;
  expanded: ReadonlySet<string>;
  selectedFolderId: string | null;
  selectedPageId: string | null;
  onToggleExpand: (id: string) => void;
  onSelectFolder: (id: string) => void;
  onSelectPage: (id: string, folderId: string) => void;
  onCreateFolder: (parentId: string | null) => void;
  onCreatePage: (folderId: string) => void;
  onReorderPages: (folderId: string, pageIds: string[]) => void;
}) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const pages = (pagesByFolder[node.id] ?? []).filter((p) =>
    pageMatchesSearch(p, searchQuery),
  );
  const showPages = !searchQuery.trim() || pages.length > 0;

  return (
    <li className="wiki-tree__branch">
      <div
        className={`wiki-tree__row wiki-tree__row--folder${selectedFolderId === node.id && !selectedPageId ? ' wiki-tree__row--selected' : ''}`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        <button
          type="button"
          className={`wiki-tree__chevron${hasChildren || pages.length > 0 ? '' : ' wiki-tree__chevron--hidden'}`}
          aria-expanded={isExpanded}
          onClick={() => onToggleExpand(node.id)}
        >
          {isExpanded ? '▾' : '▸'}
        </button>
        <button
          type="button"
          className="wiki-tree__label"
          onClick={() => {
            onSelectFolder(node.id);
            if (!isExpanded) onToggleExpand(node.id);
          }}
        >
          <span className="wiki-tree__icon wiki-tree__icon--folder" aria-hidden />
          <span className="wiki-tree__name">{node.name}</span>
        </button>
        <div className="wiki-tree__actions">
          <button
            type="button"
            className="wiki-tree__action"
            title="New page"
            onClick={(e) => {
              e.stopPropagation();
              onCreatePage(node.id);
            }}
          >
            +
          </button>
          <button
            type="button"
            className="wiki-tree__action"
            title="New subfolder"
            onClick={(e) => {
              e.stopPropagation();
              onCreateFolder(node.id);
            }}
          >
            📁
          </button>
        </div>
      </div>

      {isExpanded && (
        <ul className="wiki-tree__children">
          {showPages &&
            pages.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  draggable={!searchQuery.trim()}
                  className={`wiki-tree__row wiki-tree__row--page${selectedPageId === page.id ? ' wiki-tree__row--selected' : ''}`}
                  style={{ paddingLeft: `${20 + depth * 12}px` }}
                  onClick={() => onSelectPage(page.id, node.id)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', page.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData('text/plain');
                    if (!draggedId || draggedId === page.id) return;
                    const ids = pages.map((p) => p.id);
                    const from = ids.indexOf(draggedId);
                    const to = ids.indexOf(page.id);
                    if (from < 0 || to < 0) return;
                    const next = [...ids];
                    next.splice(from, 1);
                    next.splice(to, 0, draggedId);
                    onReorderPages(node.id, next);
                  }}
                >
                  <span className="wiki-tree__chevron wiki-tree__chevron--hidden" />
                  <span className="wiki-tree__icon wiki-tree__icon--page" aria-hidden />
                  <span className="wiki-tree__name">{page.title || 'Untitled'}</span>
                </button>
              </li>
            ))}
          {node.children.map((child) => (
            <FolderBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              pagesByFolder={pagesByFolder}
              searchQuery={searchQuery}
              expanded={expanded}
              selectedFolderId={selectedFolderId}
              selectedPageId={selectedPageId}
              onToggleExpand={onToggleExpand}
              onSelectFolder={onSelectFolder}
              onSelectPage={onSelectPage}
              onCreateFolder={onCreateFolder}
              onCreatePage={onCreatePage}
              onReorderPages={onReorderPages}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function WikiSidebar({
  spaces,
  selectedSpaceId,
  folders,
  pagesByFolder,
  selectedFolderId,
  selectedPageId,
  searchQuery,
  onSearchChange,
  onSelectFolder,
  onSelectSpace,
  onSelectPage,
  onCreateSpace,
  onCreateFolder,
  onCreatePage,
  onReorderPages,
  onRenameFolder,
}: WikiSidebarProps) {
  const allFolderIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (nodes: FolderTreeNode[]) => {
      for (const n of nodes) {
        ids.push(n.id);
        walk(n.children);
      }
    };
    walk(folders);
    return ids;
  }, [folders]);

  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(allFolderIds));

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const id of allFolderIds) next.add(id);
      return next;
    });
  }, [allFolderIds]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside className="wiki-sidebar">
      <section className="wiki-sidebar__spaces">
        <div className="wiki-sidebar__section-header">
          <h2 className="wiki-sidebar__section-title">Spaces</h2>
          <button
            type="button"
            className="wiki-btn wiki-btn--subtle wiki-btn--small"
            onClick={onCreateSpace}
          >
            + Space
          </button>
        </div>
        <ul className="wiki-spaces">
          {spaces.map((space) => (
            <li key={space.id}>
              <button
                type="button"
                className={`wiki-spaces__item${selectedSpaceId === space.id ? ' wiki-spaces__item--selected' : ''}`}
                onClick={() => onSelectSpace(space.id)}
              >
                {space.name}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <div className="wiki-sidebar__search">
        <input
          type="search"
          className="wiki-sidebar__search-input"
          placeholder="Search pages…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search pages"
        />
      </div>
      <div className="wiki-sidebar__actions-bar">
        <button
          type="button"
          className="wiki-btn wiki-btn--primary wiki-btn--block"
          onClick={() => onCreatePage(selectedFolderId ?? folders[0]?.id ?? '')}
          disabled={folders.length === 0}
        >
          Create page
        </button>
        <button
          type="button"
          className="wiki-btn wiki-btn--block"
          onClick={() => onCreateFolder(selectedSpaceId)}
          disabled={!selectedSpaceId}
        >
          Create folder in space
        </button>
      </div>
      <nav className="wiki-sidebar__tree" aria-label="Page tree">
        {folders.length === 0 ? (
          <p className="wiki-sidebar__empty">Create a folder to get started.</p>
        ) : (
          <ul className="wiki-tree">
            {folders.map((node) => (
              <FolderBranch
                key={node.id}
                node={node}
                depth={0}
                pagesByFolder={pagesByFolder}
                searchQuery={searchQuery}
                expanded={expanded}
                selectedFolderId={selectedFolderId}
                selectedPageId={selectedPageId}
                onToggleExpand={toggleExpand}
                onSelectFolder={onSelectFolder}
                onSelectPage={onSelectPage}
                onCreateFolder={onCreateFolder}
                onCreatePage={onCreatePage}
                onReorderPages={onReorderPages}
              />
            ))}
          </ul>
        )}
      </nav>
      {selectedFolderId && onRenameFolder && (
        <div className="wiki-sidebar__footer">
          <button
            type="button"
            className="wiki-btn wiki-btn--subtle wiki-btn--small"
            onClick={() => {
              const name = window.prompt('Rename folder');
              if (name) onRenameFolder(selectedFolderId, name);
            }}
          >
            Rename folder
          </button>
        </div>
      )}
    </aside>
  );
}
