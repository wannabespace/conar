import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { lastLoginMethodClient, magicLinkClient, organizationClient, twoFactorClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

const getAuthHeadersIsomorphic = createIsomorphicFn()
  .server(() => {
    const request = getRequest()

    return {
      'user-agent': request.headers.get('user-agent') ?? '',
      'cookie': request.headers.get('cookie') ?? '',
    }
  })
  .client(() => ({}))

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL,
  basePath: '/auth',
  fetchOptions: {
    headers: getAuthHeadersIsomorphic(),
  },
  plugins: [
    organizationClient(),
    twoFactorClient(),
    magicLinkClient(),
    lastLoginMethodClient(),
  ],
})

export const getSessionIsomorphic = authClient.getSession
