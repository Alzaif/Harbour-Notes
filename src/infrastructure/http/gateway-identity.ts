import { createMiddleware } from 'hono/factory';
import { GATEWAY_HEADERS } from '../../contracts/gateway-headers.v1.js';
import type { User } from '../../domain/entities/user.js';
import type { UserRepositoryPort } from '../../domain/ports/user-repository.port.js';
import type { NotesConfig } from '../config/load-config.js';
import { UnauthorizedError } from '../../shared/errors.js';

export type AppVariables = {
  user: User;
};

export function createGatewayIdentityMiddleware(
  config: NotesConfig,
  users: UserRepositoryPort,
) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    let userId: string | undefined;
    let email: string | undefined;
    let displayName: string | undefined;

    if (config.TRUST_GATEWAY_HEADERS) {
      userId = c.req.header(GATEWAY_HEADERS.userId);
      email = c.req.header(GATEWAY_HEADERS.email);
      displayName = c.req.header(GATEWAY_HEADERS.displayName);
    } else if (config.DEV_USER_ID) {
      userId = config.DEV_USER_ID;
      email = config.DEV_USER_EMAIL ?? `${config.DEV_USER_ID}@dev.local`;
      displayName = config.DEV_USER_DISPLAY_NAME ?? 'Dev User';
    }

    if (!userId || !email) {
      throw new UnauthorizedError('Missing gateway identity headers');
    }

    if (config.TRUST_GATEWAY_HEADERS) {
      const scopes = (c.req.header(GATEWAY_HEADERS.scopes) ?? '')
        .split(/\s+/)
        .filter(Boolean);
      if (!scopes.includes('app:notes')) {
        throw new UnauthorizedError('Missing app:notes scope');
      }
    }

    const user = await users.upsertFromGateway({
      id: userId,
      email,
      displayName,
    });
    c.set('user', user);
    await next();
  });
}
