/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_MAIN_URL: string
  readonly VITE_PUBLIC_PROXY_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
