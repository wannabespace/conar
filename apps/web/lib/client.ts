import type { auth } from './auth'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { nextCookies } from 'better-auth/next-js'
import { createAuthClient } from 'better-auth/react'
import { env } from '~/env'

type AuthClient = ReturnType<typeof createAuthClient>

export const authClient: AuthClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_URL,
  plugins: [
    nextCookies(),
    inferAdditionalFields<typeof auth>(),
  ],
})
