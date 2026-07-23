import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import type { PublishManifestV1 } from '../../contracts/publish-manifest.v1.js';
import { PUBLISH_MANIFEST_KEY, parsePublishManifestV1 } from '../../contracts/publish-manifest.v1.js';
import type { PublishedContentPort } from '../../domain/ports/published-content.port.js';

export interface S3PublishedContentConfig {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

function prefixKey(prefix: string, key: string): string {
  const normalized = prefix.endsWith('/') ? prefix : `${prefix}/`;
  return `${normalized}${key.replace(/^\//, '')}`;
}

export class S3PublishedContentAdapter implements PublishedContentPort {
  private readonly client: S3Client;
  private readonly defaultBucket: string;

  constructor(config: S3PublishedContentConfig) {
    const clientConfig: S3ClientConfig = {
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle,
    };
    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
    }
    this.client = new S3Client(clientConfig);
    this.defaultBucket = config.bucket;
  }

  async getPublishManifest(bucket: string, prefix: string): Promise<PublishManifestV1 | null> {
    try {
      const result = await this.getObject(bucket || this.defaultBucket, prefixKey(prefix, PUBLISH_MANIFEST_KEY));
      return parsePublishManifestV1(JSON.parse(result.body));
    } catch {
      return null;
    }
  }

  async putPublishManifest(bucket: string, prefix: string, manifest: PublishManifestV1): Promise<void> {
    await this.putObject(
      bucket || this.defaultBucket,
      prefixKey(prefix, PUBLISH_MANIFEST_KEY),
      JSON.stringify(manifest, null, 2),
      'application/json',
    );
  }

  async getObject(bucket: string, key: string): Promise<{ body: string; contentType: string; etag: string | null }> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: bucket || this.defaultBucket, Key: key }),
    );
    const body = await response.Body?.transformToString('utf8');
    if (body === undefined) throw new Error(`Object not found: ${key}`);
    return {
      body,
      contentType: response.ContentType ?? 'application/octet-stream',
      etag: response.ETag ?? null,
    };
  }

  async putObject(
    bucket: string,
    key: string,
    body: string,
    contentType: string,
  ): Promise<{ etag: string | null }> {
    const response = await this.client.send(
      new PutObjectCommand({
        Bucket: bucket || this.defaultBucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return { etag: response.ETag ?? null };
  }
}
