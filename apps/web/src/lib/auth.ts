import { AUTH_COOKIE_PREFIX } from '@conar/shared/constants'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { lastLoginMethodClient, magicLinkClient, organizationClient, twoFactorClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

const TWO_FACTOR_COOKIE_NAME = `${AUTH_COOKIE_PREFIX}.two_factor`

function hasTwoFactorPendingCookie(cookieHeader: string): boolean {
  const parts = cookieHeader.split(';').map(s => s.trim())
  return parts.some(part => part.startsWith(`${TWO_FACTOR_COOKIE_NAME}=`))
}

export const isTwoFactorPendingIsomorphic = createIsomorphicFn()
  .server(() => {
    const request = getRequest()
    const cookie = request.headers.get('cookie') ?? ''
    return hasTwoFactorPendingCookie(cookie)
  })
  .client(() => hasTwoFactorPendingCookie(document.cookie))

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL,
  basePath: '/auth',
  plugins: [
    organizationClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        const url = new URL(location.href)
        const redirectPath = url.searchParams.get('redirectPath')
        const to = redirectPath ? `/two-factor?redirectPath=${encodeURIComponent(redirectPath)}` : '/two-factor'
        window.location.href = to
      },
    }),
    magicLinkClient(),
    lastLoginMethodClient(),
  ],
})

export const getSessionIsomorphic = createIsomorphicFn()
  .server(() => {
    const request = getRequest()

    return authClient.getSession({
      fetchOptions: {
        headers: {
          cookie: request.headers.get('cookie') ?? '',
        },
      },
    })
  })
  .client(() => authClient.getSession())
