import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  client: {
    VITE_PUBLIC_URL: z.string().min(1),
    VITE_PUBLIC_IS_DESKTOP: z.enum(['true', 'false']).transform(t => t === 'true'),
  },
  clientPrefix: 'VITE_PUBLIC_',
  runtimeEnv: import.meta.env,
})
