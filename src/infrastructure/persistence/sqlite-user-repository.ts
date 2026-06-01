import { eq } from 'drizzle-orm';
import type { UserRepositoryPort } from '../../domain/ports/user-repository.port.js';
import type { User } from '../../domain/entities/user.js';
import type { ClockPort } from '../../domain/ports/clock.port.js';
import type { NotesDatabase } from './create-database.js';
import { users } from './schema.js';

function mapRow(row: typeof users.$inferSelect): User {
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
    private readonly db: NotesDatabase,
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
        .update(users)
        .set({
          email: params.email,
          displayName: params.displayName ?? existing.displayName,
          updatedAt: now,
        })
        .where(eq(users.id, params.id));
      return (await this.findById(params.id))!;
    }
    await this.db.insert(users).values({
      id: params.id,
      email: params.email,
      displayName: params.displayName ?? null,
      createdAt: now,
      updatedAt: now,
    });
    return (await this.findById(params.id))!;
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }
}
