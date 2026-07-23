import type { SpaceManifestV1 } from '../../contracts/space-manifest.v1.js';
import type { PageRef } from '../entities/page-content.js';

export interface SpaceManifestPort {
  loadManifest(contentPath: string, ref?: string): Promise<SpaceManifestV1>;
  buildPageTree(manifest: SpaceManifestV1): PageRef[];
  findPageInTree(tree: PageRef[], pageId: string): PageRef | null;
}
