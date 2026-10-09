import { getRouteApi, useRouter } from '@tanstack/react-router'
import { type } from 'arktype'

import { authClient } from '~/lib/auth'

const { useSearch } = getRouteApi('/_auth')

export const twoFactorRedirectSchema = type({
  twoFactorRedirect: 'true',
})

export const sendSignInCode = (email: string) =>
  authClient.emailOtp.sendVerificationOtp({
    email,
    fetchOptions: { throw: true },
    type: 'sign-in',
  })

export const useFinishSignIn = () => {
  const router = useRouter()
  const { redirectPath } = useSearch()

  return async ({ newUser = false } = {}) => {
    if (!redirectPath) {
      await router.invalidate()
      return
    }

    const url = new URL(location.origin + redirectPath)

    if (newUser) {
      url.searchParams.set('newUser', 'true')
    }

    await router.navigate({ to: url.pathname + url.search })
  }
}
