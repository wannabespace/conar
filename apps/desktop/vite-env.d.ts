/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_APP_URL: string
  readonly VITE_PUBLIC_AUTH_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
