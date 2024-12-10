/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_URL: string
  readonly VITE_STRONGHOLD_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
