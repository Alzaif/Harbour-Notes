/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HARBOUR_SHELL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
