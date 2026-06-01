import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_PATH: z.string().default('./data/notes.db'),
  DATA_DIR: z.string().default('./data'),
  TRUST_GATEWAY_HEADERS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  DEV_USER_ID: z.string().optional(),
  DEV_USER_EMAIL: z.string().email().optional(),
  DEV_USER_DISPLAY_NAME: z.string().optional(),
  PACKAGE_NAME: z.string().default('harbour-notes'),
  PACKAGE_VERSION: z.string().default('0.1.0'),
});

export type NotesConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): NotesConfig {
  return configSchema.parse({
    PORT: env.PORT,
    NODE_ENV: env.NODE_ENV,
    DB_PATH: env.NOTES_DB_PATH ?? env.DB_PATH,
    DATA_DIR: env.NOTES_DATA_DIR ?? env.DATA_DIR,
    TRUST_GATEWAY_HEADERS: env.TRUST_GATEWAY_HEADERS,
    DEV_USER_ID: env.DEV_USER_ID,
    DEV_USER_EMAIL: env.DEV_USER_EMAIL,
    DEV_USER_DISPLAY_NAME: env.DEV_USER_DISPLAY_NAME,
    PACKAGE_NAME: env.PACKAGE_NAME,
    PACKAGE_VERSION: env.npm_package_version ?? env.PACKAGE_VERSION,
  });
}
