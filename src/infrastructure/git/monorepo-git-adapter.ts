import { cp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import simpleGit from 'simple-git';
import type { GitRepositoryPort, GitCommitResult } from '../../domain/ports/git-repository.port.js';
import { ConflictError } from '../../shared/errors.js';
import { gitAuthorForCommit } from './git-identity.js';
import { resolveContentPathAbsolute, resolveInContentRepo } from '../../shared/space-paths.js';

export class MonorepoGitAdapter implements GitRepositoryPort {
  constructor(
    private readonly repoRoot: string,
    private readonly defaultBranch: string,
    private readonly gitRemote: string,
  ) {}

  getRepoRoot(): string {
    return this.repoRoot;
  }

  async ensureRepoReady(): Promise<void> {
    await mkdir(this.repoRoot, { recursive: true });
    const hasRepo = await this.pathExists(join(this.repoRoot, '.git'));
    const git = simpleGit(hasRepo ? this.repoRoot : dirname(this.repoRoot));
    if (!hasRepo) {
      await mkdir(dirname(this.repoRoot), { recursive: true });
      await git.clone(this.gitRemote, this.repoRoot, ['--branch', this.defaultBranch, '--depth', '1']);
    }
    const repoGit = simpleGit(this.repoRoot);
    await this.ensureOriginRemote(repoGit);
    try {
      await repoGit.pull('origin', this.defaultBranch, { '--rebase': 'true' });
    } catch {
      // Continue with the local clone if GitHub is unreachable or pull conflicts.
    }
  }

  private async ensureOriginRemote(git: ReturnType<typeof simpleGit>): Promise<void> {
    const remotes = await git.getRemotes(true);
    if (!remotes.some((remote) => remote.name === 'origin')) {
      await git.addRemote('origin', this.gitRemote);
      return;
    }
    await git.remote(['set-url', 'origin', this.gitRemote]);
  }

  async getHeadSha(): Promise<string> {
    const git = simpleGit(this.repoRoot);
    const log = await git.log({ maxCount: 1 });
    const sha = log.latest?.hash;
    if (!sha) throw new Error('Repository has no commits');
    return sha;
  }

  async readFile(contentPath: string, relativePath: string, ref?: string): Promise<string> {
    const repoRelative = join(contentPath, relativePath);
    if (ref) {
      const git = simpleGit(this.repoRoot);
      return git.show([`${ref}:${repoRelative}`]);
    }
    return readFile(resolveInContentRepo(this.repoRoot, contentPath, relativePath), 'utf8');
  }

  async writeFileAndCommit(params: {
    contentPath: string;
    relativePath: string;
    content: string;
    message: string;
    authorName: string;
    authorEmail: string;
    baseSha: string;
  }): Promise<GitCommitResult> {
    const git = simpleGit(this.repoRoot);
    const head = await this.getHeadSha();
    if (head !== params.baseSha) {
      throw new ConflictError('Page base revision mismatch; reload and retry');
    }
    const repoRelative = join(params.contentPath, params.relativePath);
    const fullPath = join(this.repoRoot, repoRelative);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, params.content, 'utf8');
    await git.add(repoRelative);
    const status = await git.status();
    if (status.isClean()) {
      return { sha: head, message: params.message };
    }
    const result = await git.commit(params.message, undefined, {
      '--author': gitAuthorForCommit(params.authorName, params.authorEmail),
    });
    return { sha: result.commit ?? head, message: params.message };
  }

  async writeFilesAndCommit(params: {
    contentPath: string;
    files: readonly { relativePath: string; content: string }[];
    message: string;
    authorName: string;
    authorEmail: string;
    baseSha: string;
  }): Promise<GitCommitResult> {
    const git = simpleGit(this.repoRoot);
    const head = await this.getHeadSha();
    if (head !== params.baseSha) {
      throw new ConflictError('Page base revision mismatch; reload and retry');
    }
    for (const file of params.files) {
      const repoRelative = join(params.contentPath, file.relativePath);
      const fullPath = join(this.repoRoot, repoRelative);
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, file.content, 'utf8');
      await git.add(repoRelative);
    }
    const status = await git.status();
    if (status.isClean()) {
      return { sha: head, message: params.message };
    }
    const result = await git.commit(params.message, undefined, {
      '--author': gitAuthorForCommit(params.authorName, params.authorEmail),
    });
    return { sha: result.commit ?? head, message: params.message };
  }

  async commitContentPath(params: {
    contentPath: string;
    message: string;
    authorName: string;
    authorEmail: string;
    baseSha: string;
  }): Promise<GitCommitResult> {
    const git = simpleGit(this.repoRoot);
    const head = await this.getHeadSha();
    if (head !== params.baseSha) {
      throw new ConflictError('Content revision mismatch; reload and retry');
    }
    await git.add(params.contentPath);
    const status = await git.status();
    if (status.isClean()) {
      return { sha: head, message: params.message };
    }
    const result = await git.commit(params.message, undefined, {
      '--author': gitAuthorForCommit(params.authorName, params.authorEmail),
    });
    return { sha: result.commit ?? head, message: params.message };
  }

  async listCommitsSince(sinceSha: string | null): Promise<number> {
    const git = simpleGit(this.repoRoot);
    if (!sinceSha) {
      const log = await git.log();
      return log.total;
    }
    try {
      const log = await git.log({ from: sinceSha, to: 'HEAD' });
      return Math.max(0, log.total - 1);
    } catch {
      return 0;
    }
  }

  async pushRef(ref: string): Promise<void> {
    const git = simpleGit(this.repoRoot);
    await git.push(['origin', ref]);
  }

  async contentPathExists(contentPath: string): Promise<boolean> {
    return this.pathExists(resolveContentPathAbsolute(this.repoRoot, contentPath));
  }

  async copyTemplateIntoSpace(contentPath: string, templateDir: string): Promise<void> {
    const dest = resolveContentPathAbsolute(this.repoRoot, contentPath);
    await mkdir(dest, { recursive: true });
    await cp(join(templateDir, 'pages'), join(dest, 'pages'), { recursive: true, force: true });
    await cp(join(templateDir, 'assets'), join(dest, 'assets'), { recursive: true, force: true });
  }

  private async pathExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}
