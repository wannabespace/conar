/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PUBLIC_URL: string
  readonly PUBLIC_IS_DESKTOP: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
