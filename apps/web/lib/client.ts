import type { auth } from './auth'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import { nextCookies } from 'better-auth/next-js'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  plugins: [
    nextCookies(),
    inferAdditionalFields<typeof auth>(),
  ],
})
