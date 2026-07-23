import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import YAML from 'yaml';
import { SPACE_MANIFEST_FILENAME, parseSpaceManifestV1 } from '../../contracts/space-manifest.v1.js';
import type { MonorepoGitAdapter } from '../git/monorepo-git-adapter.js';
import { resolveExistingSpaceTemplateDir } from '../git/resolve-template-dir.js';
import { spaceContentPath, resolveContentPathAbsolute } from '../../shared/space-paths.js';

export async function initializeSpaceInMonorepo(
  git: MonorepoGitAdapter,
  slug: string,
  authorName: string,
  authorEmail: string,
): Promise<void> {
  const contentPath = spaceContentPath(slug);
  const templateDir = await resolveExistingSpaceTemplateDir();
  const baseSha = await git.getHeadSha();

  await git.copyTemplateIntoSpace(contentPath, templateDir);

  const templateManifestRaw = await readFile(join(templateDir, SPACE_MANIFEST_FILENAME), 'utf8');
  const parsed = parseSpaceManifestV1(YAML.parse(templateManifestRaw));
  parsed.spaceId = slug;
  await writeFile(
    join(resolveContentPathAbsolute(git.getRepoRoot(), contentPath), SPACE_MANIFEST_FILENAME),
    YAML.stringify(parsed),
    'utf8',
  );

  await git.commitContentPath({
    contentPath,
    message: `Create space ${slug}`,
    authorName,
    authorEmail,
    baseSha,
  });
}
