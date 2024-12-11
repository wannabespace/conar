import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  shared: {
    NEXT_PUBLIC_URL: z.string().min(1),
    NEXT_PUBLIC_IS_DESKTOP: z.enum(['true', 'false']).transform(t => t === 'true'),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_IS_DESKTOP: process.env.NEXT_PUBLIC_IS_DESKTOP,
  },
})
