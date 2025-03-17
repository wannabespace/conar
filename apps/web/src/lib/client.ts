import type { auth } from './auth'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { env } from '~/lib/env-client'

export const authClient = createAuthClient({
  baseURL: env.VITE_PUBLIC_URL,
  plugins: [
    inferAdditionalFields<typeof auth>(),
  ],
})
