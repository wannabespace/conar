import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { lastLoginMethodClient, magicLinkClient, organizationClient, twoFactorClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL,
  basePath: '/auth',
  plugins: [
    organizationClient(),
    twoFactorClient(),
    magicLinkClient(),
    lastLoginMethodClient(),
  ],
})

export const getSessionIsomorphic = createIsomorphicFn()
  .server(() => {
    const headers = getRequestHeaders()
    return authClient.getSession({
      fetchOptions: {
        headers,
        credentials: 'include',
        onRequest: (request) => {
          console.log('onRequest', request.headers)
        },
        onResponse: (response) => {
          console.log('onResponse', response)
        },
      },
    })
  })
  .client(() => authClient.getSession())
