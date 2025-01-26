import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  client: {
    VITE_PUBLIC_APP_URL: z.string().min(1),
    VITE_PUBLIC_AUTH_SECRET: z.string().min(1),
    VITE_PUBLIC_KV_SECRET: z.string().min(1),
    VITE_PUBLIC_UPDATES_TOKEN: z.string().min(1),
    VITE_PUBLIC_POSTHOG_API_KEY: z.string().min(1),
  },
  clientPrefix: 'VITE_PUBLIC_',
  runtimeEnv: import.meta.env,
})
