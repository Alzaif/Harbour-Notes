import type { Space, SpaceMember } from '../entities/space.js';
import type { PublishRevision } from '../entities/page-content.js';

export interface SpaceRegistryPort {
  listSpacesForUser(userId: string): Promise<Space[]>;
  findSpaceBySlug(slug: string): Promise<Space | null>;
  findSpaceById(id: string): Promise<Space | null>;
  createSpace(space: Omit<Space, 'createdAt' | 'updatedAt'>): Promise<Space>;
  getMember(spaceId: string, userId: string): Promise<SpaceMember | null>;
  addMember(spaceId: string, userId: string, role: SpaceMember['role']): Promise<SpaceMember>;
  getLatestPublishRevision(spaceId: string): Promise<PublishRevision | null>;
  recordPublishRevision(revision: PublishRevision): Promise<PublishRevision>;
  getPullRequestUrl(spaceId: string, userId: string): Promise<string | null>;
  upsertPullRequestUrl(spaceId: string, userId: string, prUrl: string): Promise<void>;
}
