import type { PageRef } from '../api/types.js';
import { pageEmoji } from '../utils/page-tree.js';

interface PageTreeProps {
  readonly tree: readonly PageRef[];
  readonly selectedPageId: string | null;
  readonly expandedIds: ReadonlySet<string>;
  readonly onToggleExpand: (pageId: string) => void;
  readonly onSelectPage: (pageId: string) => void;
  readonly onCreateChildPage?: (parentPageId: string) => void;
}

function PageTreeNode({
  node,
  depth,
  selectedPageId,
  expandedIds,
  onToggleExpand,
  onSelectPage,
  onCreateChildPage,
}: {
  node: PageRef;
  depth: number;
  selectedPageId: string | null;
  expandedIds: ReadonlySet<string>;
  onToggleExpand: (pageId: string) => void;
  onSelectPage: (pageId: string) => void;
  onCreateChildPage?: (parentPageId: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const expanded = expandedIds.has(node.pageId);
  const selected = selectedPageId === node.pageId;

  return (
    <li className="wiki-tree__branch">
      <div
        className={`wiki-tree__row${selected ? ' wiki-tree__row--selected' : ''}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <button
          type="button"
          className={`wiki-tree__chevron${hasChildren ? '' : ' wiki-tree__chevron--hidden'}`}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(node.pageId);
          }}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <button
          type="button"
          className="wiki-tree__label"
          onClick={() => onSelectPage(node.pageId)}
        >
          <span className="wiki-tree__emoji" aria-hidden>
            {pageEmoji(node.pageId)}
          </span>
          <span className="wiki-tree__name">{node.title}</span>
        </button>
        {onCreateChildPage && (
          <div className="wiki-tree__actions">
            <button
              type="button"
              className="wiki-tree__action"
              title="Add child page"
              onClick={(e) => {
                e.stopPropagation();
                onCreateChildPage(node.pageId);
              }}
            >
              +
            </button>
          </div>
        )}
      </div>
      {hasChildren && expanded && (
        <ul className="wiki-tree__children">
          {node.children.map((child) => (
            <PageTreeNode
              key={child.pageId}
              node={child}
              depth={depth + 1}
              selectedPageId={selectedPageId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelectPage={onSelectPage}
              onCreateChildPage={onCreateChildPage}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function PageTree({
  tree,
  selectedPageId,
  expandedIds,
  onToggleExpand,
  onSelectPage,
  onCreateChildPage,
}: PageTreeProps) {
  if (tree.length === 0) {
    return <p className="wiki-sidebar__empty">No pages yet.</p>;
  }

  return (
    <ul className="wiki-tree">
      {tree.map((node) => (
        <PageTreeNode
          key={node.pageId}
          node={node}
          depth={0}
          selectedPageId={selectedPageId}
          expandedIds={expandedIds}
          onToggleExpand={onToggleExpand}
          onSelectPage={onSelectPage}
          onCreateChildPage={onCreateChildPage}
        />
      ))}
    </ul>
  );
}
