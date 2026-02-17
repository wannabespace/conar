import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { lastLoginMethodClient, magicLinkClient, organizationClient, twoFactorClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const getFetchOptionsIsomorphic = createIsomorphicFn()
  .server((): RequestInit => {
    const request = getRequest()

    return {
      headers: request.headers,
    }
  })
  .client((): RequestInit => {
    return {
      credentials: 'include',
    }
  })

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL,
  basePath: '/auth',
  fetchOptions: getFetchOptionsIsomorphic(),
  plugins: [
    organizationClient(),
    twoFactorClient(),
    magicLinkClient(),
    lastLoginMethodClient(),
  ],
})
