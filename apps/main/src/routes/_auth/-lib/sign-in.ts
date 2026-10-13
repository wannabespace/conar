import { getRouteApi, useRouter } from '@tanstack/react-router'

import { authClient } from '~/lib/auth'

const { useRouteContext, useSearch } = getRouteApi('/_auth')

export const sendSignInCode = (email: string) =>
  authClient.emailOtp.sendVerificationOtp({
    email,
    fetchOptions: { throw: true },
    type: 'sign-in',
  })

export const useFinishSignIn = () => {
  const router = useRouter()
  const { queryClient } = useRouteContext()
  const { redirectPath } = useSearch()

  return async ({ newUser = false } = {}) => {
    // Every in-tab sign-in must pass here: account queries are cached `static` under keys without the user, so the previous account's data would show.
    queryClient.clear()

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
