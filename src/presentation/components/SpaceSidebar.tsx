import { useEffect, useMemo, useRef, useState } from 'react';
import type { PageRef, Space } from '../api/types.js';
import { PageTree } from './PageTree.js';
import {
  filterPageTree,
  getExpandedIdsForPage,
  spaceInitials,
} from '../utils/page-tree.js';

interface SpaceSidebarProps {
  readonly spaces: readonly Space[];
  readonly selectedSpace: Space | null;
  readonly tree: readonly PageRef[];
  readonly selectedPageId: string | null;
  readonly onSelectSpace: (id: string) => void;
  readonly onSelectPage: (pageId: string) => void;
  readonly onCreateSpace: () => void;
  readonly onCreatePage: (parentPageId?: string | null) => void;
  readonly onShowOverview: () => void;
  readonly onShowHome: () => void;
  readonly isHome: boolean;
}

export function SpaceSidebar({
  spaces,
  selectedSpace,
  tree,
  selectedPageId,
  onSelectSpace,
  onSelectPage,
  onCreateSpace,
  onCreatePage,
  onShowOverview,
  onShowHome,
  isHome,
}: SpaceSidebarProps) {
  const [spaceMenuOpen, setSpaceMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredTree = useMemo(
    () => filterPageTree(tree, searchQuery),
    [tree, searchQuery],
  );

  useEffect(() => {
    setExpandedIds(getExpandedIdsForPage(tree, selectedPageId));
  }, [tree, selectedPageId]);

  useEffect(() => {
    if (!spaceMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSpaceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [spaceMenuOpen]);

  const toggleExpand = (pageId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  };

  return (
    <aside className="wiki-sidebar">
      <div className="wiki-sidebar__space-picker" ref={menuRef}>
        <button
          type="button"
          className="wiki-space-picker"
          onClick={() => setSpaceMenuOpen((open) => !open)}
          aria-expanded={spaceMenuOpen}
          aria-haspopup="listbox"
        >
          {selectedSpace ? (
            <>
              <span className="wiki-space-picker__avatar" aria-hidden>
                {spaceInitials(selectedSpace.title)}
              </span>
              <span className="wiki-space-picker__label">{selectedSpace.title}</span>
            </>
          ) : (
            <span className="wiki-space-picker__label">Harbour Notes</span>
          )}
          <span className="wiki-space-picker__chevron" aria-hidden>
            ▾
          </span>
        </button>
        {spaceMenuOpen && (
          <div className="wiki-space-picker__menu" role="listbox">
            {spaces.map((space) => (
              <button
                key={space.id}
                type="button"
                role="option"
                aria-selected={selectedSpace?.id === space.id}
                className={`wiki-space-picker__option${selectedSpace?.id === space.id ? ' wiki-space-picker__option--selected' : ''}`}
                onClick={() => {
                  onSelectSpace(space.id);
                  setSpaceMenuOpen(false);
                }}
              >
                <span className="wiki-space-picker__avatar">{spaceInitials(space.title)}</span>
                <span>{space.title}</span>
              </button>
            ))}
            <button
              type="button"
              className="wiki-space-picker__option wiki-space-picker__option--action"
              onClick={() => {
                setSpaceMenuOpen(false);
                onCreateSpace();
              }}
            >
              + New space
            </button>
          </div>
        )}
      </div>

      {isHome ? (
        <>
          <nav className="wiki-sidebar__nav">
            <button
              type="button"
              className="wiki-sidebar__nav-item wiki-sidebar__nav-item--active"
              onClick={onShowHome}
            >
              <span className="wiki-sidebar__nav-icon" aria-hidden>
                ⌂
              </span>
              Home
            </button>
            <button
              type="button"
              className="wiki-sidebar__nav-item wiki-sidebar__nav-item--primary"
              onClick={onCreateSpace}
            >
              <span className="wiki-sidebar__nav-icon" aria-hidden>
                +
              </span>
              New space
            </button>
          </nav>
          <div className="wiki-sidebar__tree-header">
            <span className="wiki-sidebar__section-title">Spaces</span>
          </div>
          <div className="wiki-sidebar__tree">
            {spaces.length === 0 ? (
              <p className="wiki-sidebar__empty">No spaces yet.</p>
            ) : (
              <ul className="wiki-home__sidebar-spaces">
                {spaces.map((space) => (
                  <li key={space.id}>
                    <button
                      type="button"
                      className="wiki-home__sidebar-space"
                      onClick={() => onSelectSpace(space.id)}
                    >
                      <span className="wiki-space-picker__avatar">{spaceInitials(space.title)}</span>
                      <span className="wiki-home__sidebar-space-name">{space.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : selectedSpace ? (
        <>
          <nav className="wiki-sidebar__nav">
            <button type="button" className="wiki-sidebar__nav-item" onClick={onShowHome}>
              <span className="wiki-sidebar__nav-icon" aria-hidden>
                ⌂
              </span>
              Home
            </button>
            <button
              type="button"
              className={`wiki-sidebar__nav-item${!selectedPageId ? ' wiki-sidebar__nav-item--active' : ''}`}
              onClick={onShowOverview}
            >
              <span className="wiki-sidebar__nav-icon" aria-hidden>
                ◉
              </span>
              Overview
            </button>
            <button type="button" className="wiki-sidebar__nav-item" disabled title="Coming soon">
              <span className="wiki-sidebar__nav-icon" aria-hidden>
                ⌕
              </span>
              Search
            </button>
            <button type="button" className="wiki-sidebar__nav-item" disabled title="Coming soon">
              <span className="wiki-sidebar__nav-icon" aria-hidden>
                ⚙
              </span>
              Space settings
            </button>
            <button
              type="button"
              className="wiki-sidebar__nav-item wiki-sidebar__nav-item--primary"
              onClick={() => onCreatePage(null)}
            >
              <span className="wiki-sidebar__nav-icon" aria-hidden>
                +
              </span>
              New page
            </button>
          </nav>

          <div className="wiki-sidebar__search">
            <input
              type="search"
              className="wiki-sidebar__search-input"
              placeholder="Filter pages…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter pages"
            />
          </div>

          <div className="wiki-sidebar__tree-header">
            <span className="wiki-sidebar__section-title">Pages</span>
            <button
              type="button"
              className="wiki-tree__action"
              title="Add page"
              onClick={() => onCreatePage(null)}
            >
              +
            </button>
          </div>

          <div className="wiki-sidebar__tree">
            <PageTree
              tree={filteredTree}
              selectedPageId={selectedPageId}
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
              onSelectPage={onSelectPage}
              onCreateChildPage={(parentId) => onCreatePage(parentId)}
            />
          </div>
        </>
      ) : null}
    </aside>
  );
}
