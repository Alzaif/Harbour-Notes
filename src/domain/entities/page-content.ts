export interface PageRef {
  readonly pageId: string;
  readonly title: string;
  readonly repoPath: string;
  readonly parentPageId: string | null;
  readonly children: PageRef[];
}

export interface SourcePage {
  readonly pageId: string;
  readonly title: string;
  readonly repoPath: string;
  readonly contentMarkdown: string;
  readonly gitSha: string;
}

export interface PageSaveResult extends SourcePage {
  readonly publishedAt: string;
  readonly prUrl: string | null;
}

export interface PublishedPage {
  readonly pageId: string;
  readonly title: string;
  readonly contentType: 'text/html' | 'text/markdown';
  readonly body: string;
  readonly etag: string | null;
  readonly publishedAt: string;
}

export interface PublishRevision {
  readonly spaceId: string;
  readonly gitSha: string;
  readonly publishedAt: Date;
  readonly manifestEtag: string | null;
}

export interface PublishResult {
  readonly gitSha: string;
  readonly publishedAt: string;
  readonly pageCount: number;
}

export interface PublishStatus {
  readonly spaceId: string;
  readonly publishedGitSha: string | null;
  readonly publishedAt: string | null;
  readonly headGitSha: string;
  readonly commitsAhead: number;
  readonly isPublished: boolean;
  readonly prUrl: string | null;
}

export interface SpacePullRequest {
  readonly spaceId: string;
  readonly userId: string;
  readonly prUrl: string;
  readonly updatedAt: Date;
}
