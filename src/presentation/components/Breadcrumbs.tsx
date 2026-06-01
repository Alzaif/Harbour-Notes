interface BreadcrumbSegment {
  readonly label: string;
  readonly onClick?: () => void;
}

interface BreadcrumbsProps {
  readonly segments: readonly BreadcrumbSegment[];
}

export function Breadcrumbs({ segments }: BreadcrumbsProps) {
  if (segments.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {segments.map((segment, index) => (
          <li key={`${segment.label}-${index}`}>
            {index > 0 && <span className="breadcrumbs__sep" aria-hidden />}
            {segment.onClick ? (
              <button type="button" className="breadcrumbs__link" onClick={segment.onClick}>
                {segment.label}
              </button>
            ) : (
              <span className="breadcrumbs__current">{segment.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
