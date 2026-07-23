export interface GitCommitResult {
  readonly sha: string;
  readonly message: string;
}

export interface GitRepositoryPort {
  /** Ensure the single content monorepo exists and is checked out. */
  ensureRepoReady(): Promise<void>;
  getRepoRoot(): string;
  getHeadSha(): Promise<string>;
  readFile(contentPath: string, relativePath: string, ref?: string): Promise<string>;
  writeFileAndCommit(params: {
    contentPath: string;
    relativePath: string;
    content: string;
    message: string;
    authorName: string;
    authorEmail: string;
    baseSha: string;
  }): Promise<GitCommitResult>;
  writeFilesAndCommit(params: {
    contentPath: string;
    files: readonly { relativePath: string; content: string }[];
    message: string;
    authorName: string;
    authorEmail: string;
    baseSha: string;
  }): Promise<GitCommitResult>;
  listCommitsSince(sinceSha: string | null): Promise<number>;
  pushRef(ref: string): Promise<void>;
  commitContentPath(params: {
    contentPath: string;
    message: string;
    authorName: string;
    authorEmail: string;
    baseSha: string;
  }): Promise<GitCommitResult>;
}
