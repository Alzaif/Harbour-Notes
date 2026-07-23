import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { UserRepositoryPort } from '../../domain/ports/user-repository.port.js';
import type { User } from '../../domain/entities/user.js';
import type { ClockPort } from '../../domain/ports/clock.port.js';
import * as schema from './schema.js';

type Db = BetterSQLite3Database<typeof schema>;

function mapRow(row: typeof schema.users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SqliteUserRepository implements UserRepositoryPort {
  constructor(
    private readonly db: Db,
    private readonly clock: ClockPort,
  ) {}

  async upsertFromGateway(params: {
    id: string;
    email: string;
    displayName?: string;
  }): Promise<User> {
    const existing = await this.findById(params.id);
    const now = this.clock.now();
    if (existing) {
      await this.db
        .update(schema.users)
        .set({
          email: params.email,
          displayName: params.displayName ?? existing.displayName,
          updatedAt: now,
        })
        .where(eq(schema.users.id, params.id));
      return (await this.findById(params.id))!;
    }
    await this.db.insert(schema.users).values({
      id: params.id,
      email: params.email,
      displayName: params.displayName ?? null,
      createdAt: now,
      updatedAt: now,
    });
    return (await this.findById(params.id))!;
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }
}
