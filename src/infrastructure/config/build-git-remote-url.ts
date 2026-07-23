import type { NotesConfig } from './load-config.js';

/** Clone/push URL for the content monorepo. Uses GitHub with token auth unless overridden (tests). */
export function buildGitRemoteUrl(config: NotesConfig): string {
  if (config.GIT_REMOTE_URL) return config.GIT_REMOTE_URL;
  const [owner, repo] = config.GITHUB_REPO.split('/');
  if (!owner || !repo) {
    throw new Error('NOTES_GITHUB_REPO must be owner/repo');
  }
  const token = encodeURIComponent(config.GITHUB_TOKEN);
  return `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
}
