import { z } from 'zod';

export const SPACE_PUBLISHED_EVENT_TYPE = 'harbour.notes.space-published.v1' as const;

export const spacePublishedV1Schema = z.object({
  type: z.literal(SPACE_PUBLISHED_EVENT_TYPE),
  spaceId: z.string().min(1),
  gitSha: z.string().min(1),
  publishedAt: z.string().datetime(),
  manifestEtag: z.string().optional(),
});

export type SpacePublishedV1 = z.infer<typeof spacePublishedV1Schema>;

export function parseSpacePublishedV1(data: unknown): SpacePublishedV1 {
  return spacePublishedV1Schema.parse(data);
}
