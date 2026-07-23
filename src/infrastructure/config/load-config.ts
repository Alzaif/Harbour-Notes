import { z } from 'zod';

const configSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  REGISTRY_DB_PATH: z.string().default('./data/registry.db'),
  DATA_DIR: z.string().default('./data'),
  CONTENT_REPO_PATH: z.string().default('./data/content-repo'),
  PUBLISH_STORAGE_DIR: z.string().default('./data/published'),
  SPACE_TEMPLATE_DIR: z.string().optional(),
  GIT_USER_NAME: z.string().default('Harbour Notes'),
  GIT_USER_EMAIL: z.string().default('notes@harbour.local'),
  DEFAULT_BRANCH: z.string().default('main'),
  TRUST_GATEWAY_HEADERS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  DEV_USER_ID: z.string().optional(),
  DEV_USER_EMAIL: z.string().email().optional(),
  DEV_USER_DISPLAY_NAME: z.string().optional(),
  PACKAGE_NAME: z.string().default('harbour-notes'),
  PACKAGE_VERSION: z.string().default('0.1.0'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('harbour-notes-published'),
  S3_ACCESS_KEY_ID: z.string().default('minioadmin'),
  S3_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  USE_S3_PUBLISH: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  PUBLISH_CALLBACK_SECRET: z.string().default('dev-publish-secret'),
  GITHUB_REPO: z
    .string()
    .min(1, 'NOTES_GITHUB_REPO is required')
    .refine((value) => /^[^/]+\/[^/]+$/.test(value), {
      message: 'NOTES_GITHUB_REPO must be owner/repo (e.g. myorg/notes-development)',
    }),
  GITHUB_TOKEN: z.string().min(1, 'NOTES_GITHUB_TOKEN is required'),
  GITHUB_BASE_BRANCH: z.string().default('main'),
  /** Test-only override for clone/push URL (e.g. file:// bare repo). */
  GIT_REMOTE_URL: z.string().optional(),
});

export type NotesConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): NotesConfig {
  return configSchema.parse({
    PORT: env.PORT,
    NODE_ENV: env.NODE_ENV,
    REGISTRY_DB_PATH: env.NOTES_REGISTRY_DB_PATH ?? env.REGISTRY_DB_PATH ?? env.NOTES_DB_PATH,
    DATA_DIR: env.NOTES_DATA_DIR ?? env.DATA_DIR,
    CONTENT_REPO_PATH:
      env.NOTES_CONTENT_REPO_PATH ?? env.CONTENT_REPO_PATH ?? env.NOTES_GIT_CACHE_DIR,
    PUBLISH_STORAGE_DIR: env.NOTES_PUBLISH_STORAGE_DIR ?? env.PUBLISH_STORAGE_DIR,
    SPACE_TEMPLATE_DIR: env.NOTES_SPACE_TEMPLATE_DIR ?? env.SPACE_TEMPLATE_DIR,
    GIT_USER_NAME: env.NOTES_GIT_USER_NAME ?? env.GIT_USER_NAME,
    GIT_USER_EMAIL: env.NOTES_GIT_USER_EMAIL ?? env.GIT_USER_EMAIL,
    DEFAULT_BRANCH: env.NOTES_DEFAULT_BRANCH ?? env.GITHUB_BASE_BRANCH ?? env.DEFAULT_BRANCH,
    TRUST_GATEWAY_HEADERS: env.TRUST_GATEWAY_HEADERS,
    DEV_USER_ID: env.DEV_USER_ID,
    DEV_USER_EMAIL: env.DEV_USER_EMAIL,
    DEV_USER_DISPLAY_NAME: env.DEV_USER_DISPLAY_NAME,
    PACKAGE_NAME: env.PACKAGE_NAME,
    PACKAGE_VERSION: env.npm_package_version ?? env.PACKAGE_VERSION,
    S3_ENDPOINT: env.NOTES_S3_ENDPOINT ?? env.S3_ENDPOINT,
    S3_REGION: env.NOTES_S3_REGION ?? env.S3_REGION,
    S3_BUCKET: env.NOTES_S3_BUCKET ?? env.S3_BUCKET,
    S3_ACCESS_KEY_ID: env.NOTES_S3_ACCESS_KEY_ID ?? env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: env.NOTES_S3_SECRET_ACCESS_KEY ?? env.S3_SECRET_ACCESS_KEY,
    S3_FORCE_PATH_STYLE: env.NOTES_S3_FORCE_PATH_STYLE ?? env.S3_FORCE_PATH_STYLE,
    USE_S3_PUBLISH: env.NOTES_USE_S3_PUBLISH ?? env.USE_S3_PUBLISH,
    PUBLISH_CALLBACK_SECRET: env.NOTES_PUBLISH_CALLBACK_SECRET ?? env.PUBLISH_CALLBACK_SECRET,
    GITHUB_REPO: env.NOTES_GITHUB_REPO ?? env.GITHUB_REPO,
    GITHUB_TOKEN: env.NOTES_GITHUB_TOKEN ?? env.GITHUB_TOKEN,
    GITHUB_BASE_BRANCH: env.NOTES_GITHUB_BASE_BRANCH ?? env.GITHUB_BASE_BRANCH,
    GIT_REMOTE_URL: env.NOTES_GIT_REMOTE_URL ?? env.GIT_REMOTE_URL,
  });
}
