import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import YAML from 'yaml';
import {
  SPACE_MANIFEST_FILENAME,
  parseSpaceManifestV1,
  type SpaceManifestV1,
} from '../../contracts/space-manifest.v1.js';
import type { SpaceManifestPort } from '../../domain/ports/space-manifest.port.js';
import type { GitRepositoryPort } from '../../domain/ports/git-repository.port.js';
import { buildPageTreeFromManifest, findPageInTree } from '../../shared/manifest-tree.js';
import { spaceManifestRelativePath } from '../../shared/space-paths.js';
import { NotFoundError } from '../../shared/errors.js';

export class YamlSpaceManifestAdapter implements SpaceManifestPort {
  constructor(private readonly git: GitRepositoryPort) {}

  async loadManifest(contentPath: string, ref?: string): Promise<SpaceManifestV1> {
    try {
      const raw = ref
        ? await this.git.readFile(contentPath, SPACE_MANIFEST_FILENAME, ref)
        : await readFile(
            join(this.git.getRepoRoot(), spaceManifestRelativePath(contentPath)),
            'utf8',
          );
      return parseSpaceManifestV1(YAML.parse(raw));
    } catch (err) {
      if (isMissingManifestError(err)) {
        throw new NotFoundError(
          'Space content not found in the GitHub content repo. Delete this space and create it again, or merge its folder on GitHub and refresh.',
        );
      }
      throw err;
    }
  }

  buildPageTree(manifest: SpaceManifestV1) {
    return buildPageTreeFromManifest(manifest.tree);
  }

  findPageInTree(tree: ReturnType<typeof buildPageTreeFromManifest>, pageId: string) {
    return findPageInTree(tree, pageId);
  }
}

function isMissingManifestError(err: unknown): boolean {
  return (
    err instanceof Error &&
    'code' in err &&
    (err as NodeJS.ErrnoException).code === 'ENOENT'
  );
}
