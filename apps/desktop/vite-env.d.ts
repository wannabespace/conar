/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_WEB_URL: string
  readonly VITE_PUBLIC_API_URL: string
  readonly VITE_PUBLIC_AUTH_SECRET: string
  readonly VITE_PUBLIC_POSTHOG_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
