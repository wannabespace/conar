import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
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
    const request = getRequest()

    console.log('cookie', request.headers.get('cookie'))

    return authClient.getSession({
      fetchOptions: {
        headers: {
          cookie: request.headers.get('cookie') ?? '',
        },
      },
    })
  })
  .client(() => authClient.getSession())
