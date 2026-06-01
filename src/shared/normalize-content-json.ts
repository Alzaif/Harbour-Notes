/** Canonical JSON string for comparing TipTap documents (ignores key order). */
export function normalizeContentJson(contentJson: string): string {
  try {
    return JSON.stringify(JSON.parse(contentJson));
  } catch {
    return contentJson;
  }
}

export function contentJsonEquals(a: string, b: string): boolean {
  return normalizeContentJson(a) === normalizeContentJson(b);
}
