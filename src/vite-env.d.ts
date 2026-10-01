/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STARS_AUTH_URL?: string;
  readonly VITE_STARS_URL?: string;
  readonly VITE_DMS_URL?: string;
  readonly VITE_FOMS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
