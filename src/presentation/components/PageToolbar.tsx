interface PageToolbarProps {
  readonly mode: 'view' | 'edit';
  readonly publishLabel: string;
  readonly prUrl?: string | null;
  readonly commentsOpen: boolean;
  readonly canEdit: boolean;
  readonly saving?: boolean;
  readonly onModeChange: (mode: 'view' | 'edit') => void;
  readonly onSave?: () => void;
  readonly onToggleComments: () => void;
}

export function PageToolbar({
  mode,
  publishLabel,
  prUrl,
  commentsOpen,
  canEdit,
  saving,
  onModeChange,
  onSave,
  onToggleComments,
}: PageToolbarProps) {
  return (
    <div className="wiki-page-toolbar">
      <div className="wiki-page-toolbar__left">
        <div className="wiki-segmented" role="group" aria-label="View mode">
          <button
            type="button"
            className={`wiki-segmented__btn${mode === 'edit' ? ' wiki-segmented__btn--active' : ''}`}
            onClick={() => onModeChange('edit')}
            disabled={!canEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className={`wiki-segmented__btn${mode === 'view' ? ' wiki-segmented__btn--active' : ''}`}
            onClick={() => onModeChange('view')}
          >
            Read
          </button>
        </div>
        {publishLabel && (
          <span className="wiki-page-toolbar__publish">{publishLabel}</span>
        )}
        {prUrl && (
          <a
            className="wiki-page-toolbar__pr-link"
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View PR
          </a>
        )}
      </div>
      <div className="wiki-page-toolbar__right">
        <button type="button" className="wiki-btn wiki-btn--subtle wiki-btn--small" disabled title="Coming soon">
          Share
        </button>
        <button
          type="button"
          className={`wiki-btn wiki-btn--subtle wiki-btn--small${commentsOpen ? ' wiki-btn--active' : ''}`}
          onClick={onToggleComments}
          aria-pressed={commentsOpen}
        >
          Comments
        </button>
        {mode === 'edit' && onSave && (
          <button
            type="button"
            className="wiki-btn wiki-btn--primary wiki-btn--small"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>
    </div>
  );
}
