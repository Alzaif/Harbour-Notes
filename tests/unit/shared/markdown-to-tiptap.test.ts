import { describe, expect, it } from 'vitest';
import { markdownToEditorHtml } from '../../../src/shared/markdown-to-tiptap.js';
import { tiptapJsonToMarkdownBody } from '../../../src/shared/tiptap-to-markdown.js';

describe('markdown-to-tiptap', () => {
  it('converts markdown to html for editor', () => {
    const html = markdownToEditorHtml('## Hello\n\nWorld');
    expect(html).toContain('<h2');
    expect(html).toContain('World');
  });

  it('round-trips simple paragraph through tiptap json markdown body', () => {
    const json = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
    });
    expect(tiptapJsonToMarkdownBody(json)).toContain('Hello');
  });
});
