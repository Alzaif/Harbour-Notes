interface CommentsPanelProps {
  readonly onClose: () => void;
}

export function CommentsPanel({ onClose }: CommentsPanelProps) {
  return (
    <aside className="wiki-comments" aria-label="Comments">
      <header className="wiki-comments__header">
        <h2 className="wiki-comments__title">Comments</h2>
        <button type="button" className="wiki-btn wiki-btn--subtle wiki-btn--small" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="wiki-comments__body">
        <p className="wiki-comments__placeholder">
          Page comments are planned for a future release. They will anchor to blocks in published
          content, similar to Docmost.
        </p>
      </div>
    </aside>
  );
}
