export interface User {
  readonly id: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
