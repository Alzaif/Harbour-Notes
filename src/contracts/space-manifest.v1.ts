import { z } from 'zod';

export const SPACE_MANIFEST_SCHEMA_ID = 'harbour.space-manifest.v1' as const;
export const SPACE_MANIFEST_FILENAME = 'harbour.space.manifest.yaml' as const;

export const spaceManifestTreeNodeSchema: z.ZodType<SpaceManifestTreeNodeV1> = z.lazy(() =>
  z.object({
    pageId: z.string().min(1),
    title: z.string().min(1),
    path: z.string().min(1),
    children: z.array(spaceManifestTreeNodeSchema).optional(),
  }),
);

export const spaceManifestV1Schema = z.object({
  schema: z.literal(SPACE_MANIFEST_SCHEMA_ID),
  spaceId: z.string().min(1),
  tree: z.array(spaceManifestTreeNodeSchema),
  publish: z
    .object({
      contentFormat: z.literal('markdown').default('markdown'),
      assetsGlob: z.string().optional(),
    })
    .optional(),
});

export type SpaceManifestTreeNodeV1 = {
  pageId: string;
  title: string;
  path: string;
  children?: SpaceManifestTreeNodeV1[];
};

export type SpaceManifestV1 = z.infer<typeof spaceManifestV1Schema>;

export function parseSpaceManifestV1(data: unknown): SpaceManifestV1 {
  return spaceManifestV1Schema.parse(data);
}
