import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import {
  emailOTPClient,
  lastLoginMethodClient,
  organizationClient,
  twoFactorClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

const getAuthHeadersIsomorphic = createIsomorphicFn()
  .server(() => {
    const request = getRequest()

    return {
      cookie: request.headers.get('cookie') ?? '',
      'user-agent': request.headers.get('user-agent') ?? '',
    }
  })
  .client(() => ({}))

let signedInSession: ReturnType<typeof authClient.getSession> | undefined

export const authClient = createAuthClient({
  basePath: '/auth',
  baseURL: import.meta.env.VITE_PUBLIC_API_URL,
  fetchOptions: {
    onRequest: (request) => {
      const headers = getAuthHeadersIsomorphic()

      for (const [key, value] of Object.entries(headers)) {
        request.headers.set(key, value)
      }

      return request
    },
    onSuccess: ({ request }) => {
      if (request.method !== 'GET') {
        signedInSession = undefined
      }
    },
  },
  plugins: [
    organizationClient(),
    twoFactorClient(),
    emailOTPClient(),
    lastLoginMethodClient(),
  ],
})

const fetchSignedInSession = async () => {
  const result = await authClient.getSession()

  if (!result.data?.user) {
    signedInSession = undefined
  }

  return result
}

// Client-only: on the server a module-level cache would hand one visitor's session to the next.
export const getCachedSession = createIsomorphicFn()
  .server(() => authClient.getSession())
  .client(() => (signedInSession ??= fetchSignedInSession()))

const LAST_USED_LOGIN_METHOD_COOKIE = 'better-auth.last_used_login_method'

export const getLastUsedLoginMethod = createIsomorphicFn()
  .server(() => {
    const cookie = getRequest().headers.get('cookie') ?? ''
    const match = cookie.match(
      new RegExp(
        `(?:^|; )${LAST_USED_LOGIN_METHOD_COOKIE}=(?<value>[^;]+)`,
        'u'
      )
    )

    const value = match?.groups?.value
    return value ? decodeURIComponent(value) : null
  })
  .client(() => authClient.getLastUsedLoginMethod())
