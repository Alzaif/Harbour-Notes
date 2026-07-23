import { marked } from 'marked';

/** Minimal empty TipTap document JSON. */
export const EMPTY_TIPTAP_DOC = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});

/** Convert markdown body (no frontmatter) to HTML for TipTap `setContent`. */
export function markdownToEditorHtml(markdown: string): string {
  const trimmed = markdown.trim();
  if (!trimmed) return '<p></p>';
  return marked.parse(trimmed, { async: false }) as string;
}
