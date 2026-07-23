export interface GitSyncResult {
  readonly branch: string;
  readonly prUrl: string | null;
}

export interface GitHostingPort {
  syncSpaceChanges(params: {
    spaceSlug: string;
    userId: string;
    userEmail: string;
    commitSha: string;
    commitMessage: string;
  }): Promise<GitSyncResult>;
}
