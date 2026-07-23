import type { PublishManifestV1 } from '../../contracts/publish-manifest.v1.js';

export interface PublishedContentPort {
  getPublishManifest(bucket: string, prefix: string): Promise<PublishManifestV1 | null>;
  putPublishManifest(bucket: string, prefix: string, manifest: PublishManifestV1): Promise<void>;
  getObject(bucket: string, key: string): Promise<{ body: string; contentType: string; etag: string | null }>;
  putObject(bucket: string, key: string, body: string, contentType: string): Promise<{ etag: string | null }>;
}
