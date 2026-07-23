import { describe, expect, it, vi, afterEach } from 'vitest';
import { GithubGitHostingAdapter } from '../../../../src/infrastructure/git-hosting/github-git-hosting-adapter.js';
import type { GitRepositoryPort } from '../../../../src/domain/ports/git-repository.port.js';

describe('GithubGitHostingAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pushes branch and creates a pull request', async () => {
    const pushRef = vi.fn().mockResolvedValue(undefined);
    const git = {
      ensureRepoReady: vi.fn().mockResolvedValue(undefined),
      pushRef,
    } as unknown as GitRepositoryPort;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('/pulls?')) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (url.endsWith('/pulls') && init?.method === 'POST') {
          return new Response(
            JSON.stringify({ html_url: 'https://github.com/acme/content/pull/42' }),
            { status: 201 },
          );
        }
        throw new Error(`Unexpected fetch: ${url}`);
      }),
    );

    const adapter = new GithubGitHostingAdapter(
      { repo: 'acme/content', token: 'ghp_test', baseBranch: 'main' },
      git,
    );

    const result = await adapter.syncSpaceChanges({
      spaceSlug: 'engineering',
      userId: 'user-1',
      userEmail: 'user@example.com',
      commitSha: 'abc1234567890abcdef',
      commitMessage: 'Update page home',
    });

    expect(pushRef).toHaveBeenCalledWith('abc1234567890abcdef:refs/heads/notes/engineering/user-1');
    expect(result.prUrl).toBe('https://github.com/acme/content/pull/42');
  });
});
