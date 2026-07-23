import { join } from 'node:path';

/** Registry + monorepo path for a space (e.g. `spaces/engineering`). */
export function spaceContentPath(slug: string): string {
  return `spaces/${slug}`;
}

export function spaceManifestRelativePath(contentPath: string): string {
  return `${contentPath}/harbour.space.manifest.yaml`;
}

export function resolveInContentRepo(repoRoot: string, contentPath: string, relativePath: string): string {
  return join(repoRoot, contentPath, relativePath);
}

export function resolveContentPathAbsolute(repoRoot: string, contentPath: string): string {
  return join(repoRoot, contentPath);
}
