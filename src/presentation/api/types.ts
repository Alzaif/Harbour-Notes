export type SpaceMemberRole = 'viewer' | 'editor' | 'admin';

export interface Space {
  id: string;
  slug: string;
  title: string;
  defaultBranch: string;
  s3Bucket: string;
  s3Prefix: string;
  departmentSlug: string | null;
  contentPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageRef {
  pageId: string;
  title: string;
  repoPath: string;
  parentPageId: string | null;
  children: PageRef[];
}

export interface PublishedPage {
  pageId: string;
  title: string;
  contentType: 'text/html' | 'text/markdown';
  body: string;
  etag: string | null;
  publishedAt: string;
}

export interface SourcePage {
  pageId: string;
  title: string;
  repoPath: string;
  contentMarkdown: string;
  gitSha: string;
}

export interface PageSaveResult extends SourcePage {
  publishedAt: string;
  prUrl: string | null;
}

export interface PublishStatus {
  spaceId: string;
  publishedGitSha: string | null;
  publishedAt: string | null;
  headGitSha: string;
  commitsAhead: number;
  isPublished: boolean;
  prUrl: string | null;
}
