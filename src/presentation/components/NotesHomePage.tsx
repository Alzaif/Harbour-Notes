import type { Space } from '../api/types.js';
import { spaceInitials } from '../utils/page-tree.js';

interface NotesHomePageProps {
  readonly spaces: readonly Space[];
  readonly onSelectSpace: (spaceId: string) => void;
  readonly onCreateSpace: () => void;
}

export function NotesHomePage({ spaces, onSelectSpace, onCreateSpace }: NotesHomePageProps) {
  return (
    <>
      <header className="wiki-page-toolbar wiki-page-toolbar--home">
        <div className="wiki-page-toolbar__left">
          <h1 className="wiki-home__heading">Home</h1>
        </div>
        <div className="wiki-page-toolbar__right">
          <button type="button" className="wiki-btn wiki-btn--primary wiki-btn--small" onClick={onCreateSpace}>
            + New space
          </button>
        </div>
      </header>
      <main className="wiki-main">
        <div className="wiki-home">
          <section className="wiki-home__hero">
            <p className="wiki-home__eyebrow">Harbour Notes</p>
            <h2 className="wiki-home__title">Team wikis, versioned in Git</h2>
            <p className="wiki-home__lead">
              Spaces are department or team wikis. Edit in the browser — every save commits to the shared
              content repo, publishes read-only pages instantly, and opens a pull request when GitHub is
              configured.
            </p>
          </section>

          <section className="wiki-home__section">
            <div className="wiki-home__section-head">
              <h3 className="wiki-home__section-title">Your spaces</h3>
              <span className="wiki-home__section-meta">
                {spaces.length} space{spaces.length === 1 ? '' : 's'}
              </span>
            </div>

            {spaces.length === 0 ? (
              <div className="wiki-home__empty">
                <div className="wiki-home__empty-icon" aria-hidden>
                  📚
                </div>
                <h4>No spaces yet</h4>
                <p>Create your first space to start adding pages. Content lives in one shared Git monorepo.</p>
                <button type="button" className="wiki-btn wiki-btn--primary" onClick={onCreateSpace}>
                  Create a space
                </button>
              </div>
            ) : (
              <ul className="wiki-home__space-grid">
                {spaces.map((space) => (
                  <li key={space.id}>
                    <button
                      type="button"
                      className="wiki-home__space-card"
                      onClick={() => onSelectSpace(space.id)}
                    >
                      <span className="wiki-home__space-avatar" aria-hidden>
                        {spaceInitials(space.title)}
                      </span>
                      <span className="wiki-home__space-body">
                        <span className="wiki-home__space-name">{space.title}</span>
                        <span className="wiki-home__space-slug">{space.slug}</span>
                        {space.departmentSlug && (
                          <span className="wiki-home__space-dept">{space.departmentSlug}</span>
                        )}
                      </span>
                      <span className="wiki-home__space-arrow" aria-hidden>
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="wiki-home__section wiki-home__section--tips">
            <h3 className="wiki-home__section-title">Getting started</h3>
            <ul className="wiki-home__tips">
              <li>
                <strong>Pick a space</strong> — open it from the list or the sidebar to see its page tree.
              </li>
              <li>
                <strong>Read published pages</strong> — Read mode serves HTML from the publish store, updated on every save.
              </li>
              <li>
                <strong>Edit and save</strong> — switch to Edit mode, write markdown, and click Save. Publishing and Git sync happen automatically.
              </li>
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
