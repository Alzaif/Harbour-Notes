import type { PageRef, Space } from '../api/types.js';
import { pageEmoji, spaceInitials } from '../utils/page-tree.js';

interface SpaceOverviewPageProps {
  readonly space: Space;
  readonly tree: readonly PageRef[];
  readonly onSelectPage: (pageId: string) => void;
  readonly onCreatePage: () => void;
}

function flattenPages(tree: readonly PageRef[]): PageRef[] {
  return tree.flatMap((node) => [node, ...flattenPages(node.children)]);
}

export function SpaceOverviewPage({
  space,
  tree,
  onSelectPage,
  onCreatePage,
}: SpaceOverviewPageProps) {
  const pages = flattenPages(tree);
  const topLevel = tree;

  return (
    <>
      <header className="wiki-page-toolbar wiki-page-toolbar--home">
        <div className="wiki-page-toolbar__left">
          <span className="wiki-space-overview__avatar" aria-hidden>
            {spaceInitials(space.title)}
          </span>
          <h1 className="wiki-home__heading">{space.title}</h1>
        </div>
        <div className="wiki-page-toolbar__right">
          <button type="button" className="wiki-btn wiki-btn--primary wiki-btn--small" onClick={onCreatePage}>
            + New page
          </button>
        </div>
      </header>
      <main className="wiki-main">
        <div className="wiki-home wiki-home--space">
          <section className="wiki-home__hero wiki-home__hero--compact">
            <p className="wiki-home__eyebrow">Space overview</p>
            <p className="wiki-home__lead">
              {pages.length} page{pages.length === 1 ? '' : 's'} · slug{' '}
              <code className="wiki-home__code">{space.slug}</code>
              {space.departmentSlug && (
                <>
                  {' '}
                  · dept <code className="wiki-home__code">{space.departmentSlug}</code>
                </>
              )}
            </p>
          </section>

          {pages.length === 0 ? (
            <section className="wiki-home__section">
              <div className="wiki-home__empty">
                <div className="wiki-home__empty-icon" aria-hidden>
                  📄
                </div>
                <h4>No pages in this space</h4>
                <p>Add a page — content is saved to the monorepo and published automatically.</p>
                <button type="button" className="wiki-btn wiki-btn--primary" onClick={onCreatePage}>
                  Create first page
                </button>
              </div>
            </section>
          ) : (
            <>
              <section className="wiki-home__section">
                <div className="wiki-home__section-head">
                  <h3 className="wiki-home__section-title">Top-level pages</h3>
                </div>
                <ul className="wiki-home__page-list">
                  {topLevel.map((page) => (
                    <li key={page.pageId}>
                      <button
                        type="button"
                        className="wiki-home__page-row"
                        onClick={() => onSelectPage(page.pageId)}
                      >
                        <span className="wiki-home__page-icon" aria-hidden>
                          {pageEmoji(page.pageId)}
                        </span>
                        <span className="wiki-home__page-info">
                          <span className="wiki-home__page-title">{page.title}</span>
                          {page.children.length > 0 && (
                            <span className="wiki-home__page-meta">
                              {page.children.length} nested page{page.children.length === 1 ? '' : 's'}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              {pages.length > topLevel.length && (
                <section className="wiki-home__section">
                  <div className="wiki-home__section-head">
                    <h3 className="wiki-home__section-title">All pages</h3>
                  </div>
                  <ul className="wiki-home__page-list wiki-home__page-list--compact">
                    {pages.map((page) => (
                      <li key={page.pageId}>
                        <button
                          type="button"
                          className="wiki-home__page-row wiki-home__page-row--compact"
                          onClick={() => onSelectPage(page.pageId)}
                        >
                          <span className="wiki-home__page-icon" aria-hidden>
                            {pageEmoji(page.pageId)}
                          </span>
                          <span className="wiki-home__page-title">{page.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
