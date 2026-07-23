const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

export function parseMarkdownFrontmatter(raw: string): { title: string | null; body: string } {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return { title: null, body: raw };
  const frontmatter = match[1] ?? '';
  const body = match[2] ?? '';
  const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return { title: titleMatch?.[1]?.trim() ?? null, body };
}

export function serializeMarkdownFrontmatter(title: string, body: string): string {
  const safeTitle = title.replace(/"/g, '\\"');
  return `---\ntitle: "${safeTitle}"\n---\n\n${body.replace(/^\n+/, '')}`;
}
