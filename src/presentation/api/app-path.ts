/// <reference types="vite/client" />

/** Prefix a relative API path with the Vite base (e.g. `/notes/`). */
export function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
}
