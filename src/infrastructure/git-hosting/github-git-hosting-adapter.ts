import type { GitHostingPort, GitSyncResult } from '../../domain/ports/git-hosting.port.js';
import type { GitRepositoryPort } from '../../domain/ports/git-repository.port.js';

export interface GithubGitHostingConfig {
  readonly repo: string;
  readonly token: string;
  readonly baseBranch: string;
}

function branchName(spaceSlug: string, userId: string): string {
  const safeUser = userId.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `notes/${spaceSlug}/${safeUser}`;
}

export class GithubGitHostingAdapter implements GitHostingPort {
  constructor(
    private readonly config: GithubGitHostingConfig,
    private readonly git: GitRepositoryPort,
  ) {}

  async syncSpaceChanges(params: {
    spaceSlug: string;
    userId: string;
    userEmail: string;
    commitSha: string;
    commitMessage: string;
  }): Promise<GitSyncResult> {
    const branch = branchName(params.spaceSlug, params.userId);
    const ref = `${params.commitSha}:refs/heads/${branch}`;

    await this.git.ensureRepoReady();
    await this.git.pushRef(ref);

    const prUrl = await this.createOrUpdatePullRequest({
      branch,
      title: `Notes: ${params.commitMessage}`,
      body: `Automated update from Harbour Notes by ${params.userEmail} @ ${params.commitSha.slice(0, 7)}`,
    });

    return { branch, prUrl };
  }

  private async githubFetch(path: string, init?: RequestInit): Promise<Response> {
    const [owner, repo] = this.config.repo.split('/');
    if (!owner || !repo) throw new Error('NOTES_GITHUB_REPO must be owner/repo');
    const url = `https://api.github.com/repos/${owner}/${repo}${path}`;
    return fetch(url, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.config.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init?.headers ?? {}),
      },
    });
  }

  private async createOrUpdatePullRequest(params: {
    branch: string;
    title: string;
    body: string;
  }): Promise<string> {
    const [owner] = this.config.repo.split('/');
    const listRes = await this.githubFetch(
      `/pulls?head=${encodeURIComponent(`${owner}:${params.branch}`)}&state=open`,
    );
    if (!listRes.ok) {
      const body = await listRes.text();
      throw new Error(`GitHub list PRs failed (${listRes.status}): ${body}`);
    }
    const existing = (await listRes.json()) as { html_url?: string }[];
    if (existing[0]?.html_url) return existing[0].html_url;

    const createRes = await this.githubFetch('/pulls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: params.title,
        body: params.body,
        head: params.branch,
        base: this.config.baseBranch,
      }),
    });
    if (!createRes.ok) {
      const body = await createRes.text();
      throw new Error(`GitHub create PR failed (${createRes.status}): ${body}`);
    }
    const created = (await createRes.json()) as { html_url?: string };
    if (!created.html_url) {
      throw new Error('GitHub create PR response missing html_url');
    }
    return created.html_url;
  }
}
