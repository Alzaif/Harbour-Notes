import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDir = dirname(fileURLToPath(import.meta.url));

export async function resolveExistingSpaceTemplateDir(
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  if (env.NOTES_SPACE_TEMPLATE_DIR?.trim()) {
    return env.NOTES_SPACE_TEMPLATE_DIR.trim();
  }
  if (env.SPACE_TEMPLATE_DIR?.trim()) {
    return env.SPACE_TEMPLATE_DIR.trim();
  }

  const candidates = [
    join(process.cwd(), 'fixtures/space-template'),
    join(moduleDir, '../../../fixtures/space-template'),
    join(moduleDir, '../../../../fixtures/space-template'),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `Space template not found. Set NOTES_SPACE_TEMPLATE_DIR or ensure fixtures/space-template exists (tried: ${candidates.join(', ')})`,
  );
}
