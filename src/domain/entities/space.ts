export type SpaceMemberRole = 'viewer' | 'editor' | 'admin';

export interface Space {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly defaultBranch: string;
  readonly s3Bucket: string;
  readonly s3Prefix: string;
  readonly departmentSlug: string | null;
  /** Path within the content monorepo, e.g. `spaces/engineering`. */
  readonly contentPath: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SpaceMember {
  readonly spaceId: string;
  readonly userId: string;
  readonly role: SpaceMemberRole;
  readonly joinedAt: Date;
}

export interface CreateSpaceParams {
  readonly slug: string;
  readonly title: string;
  readonly departmentSlug?: string | null;
  readonly s3Prefix?: string;
}
