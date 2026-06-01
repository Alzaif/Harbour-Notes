import type { User } from '../entities/user.js';

export interface UserRepositoryPort {
  upsertFromGateway(params: {
    id: string;
    email: string;
    displayName?: string;
  }): Promise<User>;
  findById(id: string): Promise<User | null>;
}
