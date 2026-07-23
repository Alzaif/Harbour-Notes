import { describe, expect, it } from 'vitest';
import { parseMarkdownFrontmatter, serializeMarkdownFrontmatter } from '../../../src/shared/markdown-frontmatter.js';

describe('markdown-frontmatter', () => {
  it('round-trips title', () => {
    const raw = serializeMarkdownFrontmatter('Hello', 'Body text');
    const parsed = parseMarkdownFrontmatter(raw);
    expect(parsed.title).toBe('Hello');
    expect(parsed.body.trim()).toBe('Body text');
  });
});
