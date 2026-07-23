import type { Context } from 'hono';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../shared/errors.js';

export function handleError(err: unknown, c: Context): Response {
  if (err instanceof NotFoundError) {
    return c.json({ error: err.message }, 404);
  }
  if (err instanceof ValidationError) {
    return c.json({ error: err.message }, 400);
  }
  if (err instanceof ConflictError) {
    return c.json({ error: err.message }, 409);
  }
  if (err instanceof UnauthorizedError) {
    return c.json({ error: err.message }, 401);
  }
  if (err instanceof ForbiddenError) {
    return c.json({ error: err.message }, 403);
  }
  console.error(
    JSON.stringify({
      level: 'error',
      message: 'Unhandled error',
      err: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }),
  );
  return c.json({ error: 'Internal server error' }, 500);
}
