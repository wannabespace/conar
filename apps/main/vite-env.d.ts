/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_URL: string
  readonly VITE_PUBLIC_SHARE_URL: string
  readonly VITE_PUBLIC_WEB_URL: string
  readonly VITE_PUBLIC_POSTHOG_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
