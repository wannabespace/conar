import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  client: {
    VITE_PUBLIC_APP_URL: z.string().min(1),
  },
  clientPrefix: 'VITE_PUBLIC_',
  runtimeEnv: import.meta.env,
})
