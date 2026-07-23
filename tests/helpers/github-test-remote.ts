import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import simpleGit from 'simple-git';

/** Seeds a bare git remote for tests (simulates GitHub). Returns a file:// clone URL. */
export async function seedBareGitRemote(baseDir: string, branch = 'main'): Promise<string> {
  const barePath = join(baseDir, 'remote.git');
  const workPath = join(baseDir, 'seed-work');
  await mkdir(workPath, { recursive: true });

  await simpleGit().init(['--bare', '-b', branch, barePath]);

  const workGit = simpleGit(workPath);
  await workGit.init(['-b', branch]);
  await writeFile(join(workPath, 'README.md'), '# Harbour Notes content\n', 'utf8');
  await mkdir(join(workPath, 'spaces'), { recursive: true });
  await workGit.add('.');
  await workGit.commit('Initial content monorepo');
  await workGit.addRemote('origin', barePath);
  await workGit.push(['-u', 'origin', branch]);

  return `file://${barePath}`;
}

export const TEST_GITHUB_REPO = 'test-owner/test-repo';
export const TEST_GITHUB_TOKEN = 'test-token';

export function createGithubFetchMock(repo = TEST_GITHUB_REPO): typeof fetch {
  const [owner, name] = repo.split('/');
  return (async (input: string | URL, init?: RequestInit) => {
    const url = input.toString();
    if (!url.includes(`api.github.com/repos/${owner}/${name}`)) {
      throw new Error(`Unexpected fetch in test: ${url}`);
    }
    if (url.includes('/pulls?') && (!init?.method || init.method === 'GET')) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (url.endsWith('/pulls') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({ html_url: `https://github.com/${owner}/${name}/pull/1` }),
        { status: 201 },
      );
    }
    throw new Error(`Unhandled GitHub API request in test: ${url} ${init?.method ?? 'GET'}`);
  }) as typeof fetch;
}
