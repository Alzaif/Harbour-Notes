import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { PublishManifestV1 } from '../../contracts/publish-manifest.v1.js';
import { PUBLISH_MANIFEST_KEY, parsePublishManifestV1 } from '../../contracts/publish-manifest.v1.js';
import type { PublishedContentPort } from '../../domain/ports/published-content.port.js';
import { createHash } from 'node:crypto';

/** Local filesystem stand-in for S3 — used in tests and offline dev without MinIO. */
export class FilesystemPublishedContentAdapter implements PublishedContentPort {
  constructor(private readonly rootDir: string) {}

  private resolve(bucket: string, key: string): string {
    return join(this.rootDir, bucket, key);
  }

  async getPublishManifest(bucket: string, prefix: string): Promise<PublishManifestV1 | null> {
    const key = `${prefix.replace(/\/?$/, '/')}${PUBLISH_MANIFEST_KEY}`;
    try {
      const raw = await readFile(this.resolve(bucket, key), 'utf8');
      return parsePublishManifestV1(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  async putPublishManifest(bucket: string, prefix: string, manifest: PublishManifestV1): Promise<void> {
    const key = `${prefix.replace(/\/?$/, '/')}${PUBLISH_MANIFEST_KEY}`;
    const path = this.resolve(bucket, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(manifest, null, 2), 'utf8');
  }

  async getObject(bucket: string, key: string): Promise<{ body: string; contentType: string; etag: string | null }> {
    const body = await readFile(this.resolve(bucket, key), 'utf8');
    const etag = createHash('md5').update(body).digest('hex');
    const contentType = key.endsWith('.html')
      ? 'text/html'
      : key.endsWith('.md')
        ? 'text/markdown'
        : 'application/json';
    return { body, contentType, etag };
  }

  async putObject(
    bucket: string,
    key: string,
    body: string,
    contentType: string,
  ): Promise<{ etag: string | null }> {
    void contentType;
    const path = this.resolve(bucket, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body, 'utf8');
    return { etag: createHash('md5').update(body).digest('hex') };
  }
}
