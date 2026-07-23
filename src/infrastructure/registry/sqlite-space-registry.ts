import { randomUUID } from 'node:crypto';
import { eq, and, desc } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { Space, SpaceMember } from '../../domain/entities/space.js';
import type { PublishRevision } from '../../domain/entities/page-content.js';
import type { SpaceRegistryPort } from '../../domain/ports/space-registry.port.js';
import type { ClockPort } from '../../domain/ports/clock.port.js';
import * as schema from './schema.js';

type Db = BetterSQLite3Database<typeof schema>;

function mapSpace(row: typeof schema.spaces.$inferSelect): Space {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    defaultBranch: row.defaultBranch,
    s3Bucket: row.s3Bucket,
    s3Prefix: row.s3Prefix,
    departmentSlug: row.departmentSlug,
    contentPath: row.contentPath,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SqliteSpaceRegistry implements SpaceRegistryPort {
  constructor(
    private readonly db: Db,
    private readonly clock: ClockPort,
  ) {}

  async listSpacesForUser(userId: string): Promise<Space[]> {
    const rows = await this.db
      .select({ space: schema.spaces })
      .from(schema.spaceMembers)
      .innerJoin(schema.spaces, eq(schema.spaceMembers.spaceId, schema.spaces.id))
      .where(eq(schema.spaceMembers.userId, userId));
    return rows.map((r) => mapSpace(r.space));
  }

  async findSpaceBySlug(slug: string): Promise<Space | null> {
    const rows = await this.db.select().from(schema.spaces).where(eq(schema.spaces.slug, slug)).limit(1);
    return rows[0] ? mapSpace(rows[0]) : null;
  }

  async findSpaceById(id: string): Promise<Space | null> {
    const rows = await this.db.select().from(schema.spaces).where(eq(schema.spaces.id, id)).limit(1);
    return rows[0] ? mapSpace(rows[0]) : null;
  }

  async createSpace(space: Omit<Space, 'createdAt' | 'updatedAt'>): Promise<Space> {
    const now = this.clock.now();
    await this.db.insert(schema.spaces).values({
      id: space.id,
      slug: space.slug,
      title: space.title,
      defaultBranch: space.defaultBranch,
      s3Bucket: space.s3Bucket,
      s3Prefix: space.s3Prefix,
      departmentSlug: space.departmentSlug,
      contentPath: space.contentPath,
      createdAt: now,
      updatedAt: now,
    });
    return { ...space, createdAt: now, updatedAt: now };
  }

  async getMember(spaceId: string, userId: string): Promise<SpaceMember | null> {
    const rows = await this.db
      .select()
      .from(schema.spaceMembers)
      .where(and(eq(schema.spaceMembers.spaceId, spaceId), eq(schema.spaceMembers.userId, userId)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      spaceId: row.spaceId,
      userId: row.userId,
      role: row.role as SpaceMember['role'],
      joinedAt: row.joinedAt,
    };
  }

  async addMember(spaceId: string, userId: string, role: SpaceMember['role']): Promise<SpaceMember> {
    const joinedAt = this.clock.now();
    await this.db.insert(schema.spaceMembers).values({ spaceId, userId, role, joinedAt });
    return { spaceId, userId, role, joinedAt };
  }

  async getLatestPublishRevision(spaceId: string): Promise<PublishRevision | null> {
    const rows = await this.db
      .select()
      .from(schema.publishRevisions)
      .where(eq(schema.publishRevisions.spaceId, spaceId))
      .orderBy(desc(schema.publishRevisions.publishedAt))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      spaceId: row.spaceId,
      gitSha: row.gitSha,
      publishedAt: row.publishedAt,
      manifestEtag: row.manifestEtag,
    };
  }

  async recordPublishRevision(revision: PublishRevision): Promise<PublishRevision> {
    await this.db.insert(schema.publishRevisions).values({
      id: randomUUID(),
      spaceId: revision.spaceId,
      gitSha: revision.gitSha,
      publishedAt: revision.publishedAt,
      manifestEtag: revision.manifestEtag,
    });
    return revision;
  }

  async getPullRequestUrl(spaceId: string, userId: string): Promise<string | null> {
    const rows = await this.db
      .select()
      .from(schema.spacePullRequests)
      .where(
        and(
          eq(schema.spacePullRequests.spaceId, spaceId),
          eq(schema.spacePullRequests.userId, userId),
        ),
      )
      .limit(1);
    return rows[0]?.prUrl ?? null;
  }

  async upsertPullRequestUrl(spaceId: string, userId: string, prUrl: string): Promise<void> {
    const now = this.clock.now();
    await this.db
      .insert(schema.spacePullRequests)
      .values({ spaceId, userId, prUrl, updatedAt: now })
      .onConflictDoUpdate({
        target: [schema.spacePullRequests.spaceId, schema.spacePullRequests.userId],
        set: { prUrl, updatedAt: now },
      });
  }
}
