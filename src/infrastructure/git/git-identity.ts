import type { SimpleGit } from 'simple-git';

const DEFAULT_NAME = 'Harbour Notes';
const DEFAULT_EMAIL = 'notes@harbour.local';

/** Set repo-local git author so commits work in containers without global git config. */
export async function ensureGitRepositoryIdentity(git: SimpleGit): Promise<void> {
  const name = process.env.NOTES_GIT_USER_NAME?.trim() || DEFAULT_NAME;
  const email = process.env.NOTES_GIT_USER_EMAIL?.trim() || DEFAULT_EMAIL;
  await git.addConfig('user.name', name, false, 'local');
  await git.addConfig('user.email', email, false, 'local');
}

export function gitAuthorForCommit(displayName: string, email: string): string {
  const safeName = displayName.trim() || DEFAULT_NAME;
  const safeEmail = email.trim() || DEFAULT_EMAIL;
  return `${safeName} <${safeEmail}>`;
}
