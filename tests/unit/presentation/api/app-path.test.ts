import { describe, expect, it } from 'vitest';
import { apiUrl } from '@/presentation/api/app-path';

describe('apiUrl', () => {
  it('prefixes API paths with the Vite base', () => {
    expect(apiUrl('/api/folders')).toBe('/notes/api/folders');
  });
});
