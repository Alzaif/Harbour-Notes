/** Extract searchable plain text from TipTap/ProseMirror JSON document string. */
export function extractPlainText(contentJson: string): string {
  try {
    const doc = JSON.parse(contentJson) as { content?: unknown[] };
    const parts: string[] = [];
    walkNodes(doc.content ?? [], parts);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

function walkNodes(nodes: unknown[], parts: string[]): void {
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (n.type === 'text' && typeof n.text === 'string') {
      parts.push(n.text);
    }
    if (Array.isArray(n.content)) {
      walkNodes(n.content, parts);
    }
  }
}

export const EMPTY_DOC_JSON = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});
