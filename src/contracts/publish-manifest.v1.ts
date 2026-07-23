import { z } from 'zod';

export const PUBLISH_MANIFEST_SCHEMA_ID = 'harbour.publish-manifest.v1' as const;
export const PUBLISH_MANIFEST_KEY = 'publish-manifest.json' as const;

export const publishManifestPageV1Schema = z.object({
  pageId: z.string().min(1),
  title: z.string().min(1),
  publishedKey: z.string().min(1),
  contentHash: z.string().min(1),
});

export const publishManifestV1Schema = z.object({
  schema: z.literal(PUBLISH_MANIFEST_SCHEMA_ID),
  spaceId: z.string().min(1),
  gitSha: z.string().min(1),
  publishedAt: z.string().datetime(),
  pages: z.array(publishManifestPageV1Schema),
});

export type PublishManifestPageV1 = z.infer<typeof publishManifestPageV1Schema>;
export type PublishManifestV1 = z.infer<typeof publishManifestV1Schema>;

export function parsePublishManifestV1(data: unknown): PublishManifestV1 {
  return publishManifestV1Schema.parse(data);
}
