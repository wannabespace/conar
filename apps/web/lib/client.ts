import type { auth } from './auth'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { nextCookies } from 'better-auth/next-js'
import { createAuthClient } from 'better-auth/react'
import { env } from '~/env'

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_URL,
  plugins: [
    nextCookies(),
    inferAdditionalFields<typeof auth>(),
  ],
})
