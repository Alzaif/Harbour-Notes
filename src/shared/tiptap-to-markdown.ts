/** Convert TipTap/ProseMirror JSON document to Markdown (MVP subset). */
export function tiptapJsonToMarkdown(contentJson: string, title: string): string {
  let doc: { content?: unknown[] };
  try {
    doc = JSON.parse(contentJson) as { content?: unknown[] };
  } catch {
    return `# ${title}\n\n`;
  }
  const lines: string[] = [`# ${title}`, ''];
  if (doc.content) {
    for (const node of doc.content) {
      lines.push(...nodeToMarkdown(node, 0));
    }
  }
  return lines.join('\n').trimEnd() + '\n';
}

function nodeToMarkdown(node: unknown, listDepth: number): string[] {
  if (!node || typeof node !== 'object') return [];
  const n = node as {
    type?: string;
    text?: string;
    attrs?: { level?: number; src?: string; alt?: string };
    content?: unknown[];
    marks?: { type: string; attrs?: { href?: string } }[];
  };

  switch (n.type) {
    case 'heading': {
      const level = n.attrs?.level ?? 1;
      const text = inlineText(n.content ?? []);
      return [`${'#'.repeat(level)} ${text}`, ''];
    }
    case 'paragraph': {
      const text = inlineText(n.content ?? []);
      return text ? [text, ''] : [''];
    }
    case 'bulletList':
      return (n.content ?? []).flatMap((item) =>
        listItemToMarkdown(item, listDepth, '-'),
      );
    case 'orderedList':
      return (n.content ?? []).flatMap((item, i) =>
        listItemToMarkdown(item, listDepth, `${i + 1}.`),
      );
    case 'image': {
      const alt = n.attrs?.alt ?? 'image';
      const src = n.attrs?.src ?? '';
      return [`![${alt}](${src})`, ''];
    }
    case 'codeBlock': {
      const text = inlineText(n.content ?? []);
      return ['```', text, '```', ''];
    }
    default:
      if (n.content) {
        return n.content.flatMap((child) => nodeToMarkdown(child, listDepth));
      }
      return [];
  }
}

function listItemToMarkdown(
  item: unknown,
  depth: number,
  marker: string,
): string[] {
  if (!item || typeof item !== 'object') return [];
  const li = item as { content?: unknown[] };
  const indent = '  '.repeat(depth);
  const lines: string[] = [];
  for (const child of li.content ?? []) {
    const c = child as { type?: string; content?: unknown[] };
    if (c.type === 'paragraph') {
      lines.push(`${indent}${marker} ${inlineText(c.content ?? [])}`);
    } else if (c.type === 'bulletList' || c.type === 'orderedList') {
      lines.push(...nodeToMarkdown(child, depth + 1));
    } else {
      lines.push(...nodeToMarkdown(child, depth));
    }
  }
  return [...lines, ''];
}

function inlineText(nodes: unknown[]): string {
  return nodes
    .map((node) => {
      if (!node || typeof node !== 'object') return '';
      const n = node as {
        type?: string;
        text?: string;
        marks?: { type: string; attrs?: { href?: string } }[];
      };
      if (n.type !== 'text' || !n.text) return '';
      let t = n.text;
      for (const mark of n.marks ?? []) {
        if (mark.type === 'bold') t = `**${t}**`;
        if (mark.type === 'italic') t = `*${t}*`;
        if (mark.type === 'code') t = `\`${t}\``;
        if (mark.type === 'link' && mark.attrs?.href) {
          t = `[${t}](${mark.attrs.href})`;
        }
      }
      return t;
    })
    .join('');
}
