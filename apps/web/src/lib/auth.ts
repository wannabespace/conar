import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { lastLoginMethodClient, magicLinkClient, organizationClient, twoFactorClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const getAuthHeadersIsomorphic = createIsomorphicFn()
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
    onRequest: (request) => {
      const headers = getAuthHeadersIsomorphic()

      for (const [key, value] of Object.entries(headers)) {
        request.headers.set(key, value)
      }

      return request
    },
  },
  plugins: [
    organizationClient(),
    twoFactorClient(),
    magicLinkClient(),
    lastLoginMethodClient(),
  ],
})

export const getSessionIsomorphic = authClient.getSession
