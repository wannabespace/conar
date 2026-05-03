/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_MAIN_URL: string
  readonly VITE_PUBLIC_API_URL: string
  readonly VITE_PUBLIC_PROXY_URL: string
  readonly VITE_PUBLIC_POSTHOG_API_KEY: string
  readonly VITE_TEST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
