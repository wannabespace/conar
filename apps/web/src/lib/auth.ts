import type { auth } from '@conar/api/src/lib/auth'
import { stripeClient } from '@better-auth/stripe/client'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { inferAdditionalFields, lastLoginMethodClient, magicLinkClient, organizationClient, twoFactorClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL,
  basePath: '/auth',
  plugins: [
    inferAdditionalFields<typeof auth>(),
    organizationClient(),
    twoFactorClient(),
    magicLinkClient(),
    lastLoginMethodClient(),
    stripeClient({ subscription: true }),
  ],
})

export const getSessionIsomorphic = createIsomorphicFn()
  .server(() => authClient.getSession({ fetchOptions: {
    headers: getRequestHeaders(),
  } }))
  .client(() => authClient.getSession())
