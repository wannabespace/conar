import { tryCatchAsync } from '@tamery/shared/utils/helpers'
import { type } from 'arktype'
import { organizationClient } from 'better-auth/client/plugins'
import { bearer } from 'better-auth/plugins/bearer'
import { createAuthClient } from 'better-auth/react'
import { createWebStorageValue } from 'seitu/web'
import { toast } from 'sonner'

import { router } from '~/main'

import { apiUrl } from '../utils/utils'
import { encryptionKey } from './encryption-key'
import { lastLocationStorageValue } from './last-location'

const BEARER_TOKEN_KEY = 'tamery.bearer_token'

export const bearerToken = createWebStorageValue({
  defaultValue: null,
  key: BEARER_TOKEN_KEY,
  schema: type('string | null'),
  type: 'localStorage',
})

export const successAuthToast = (newUser: boolean) => {
  toast.success(
    newUser
      ? "Welcome to Tamery! We're excited to help you manage your connections with ease. Get started by creating your first connection."
      : 'Welcome back! Your connections are ready for you.',
    {
      duration: 10_000,
      position: 'top-center',
    }
  )
}

export const authClient = createAuthClient({
  basePath: '/auth',
  baseURL: apiUrl,
  fetchOptions: {
    auth: {
      token: () => bearerToken.get() ?? undefined,
      type: 'Bearer',
    },
    headers: {
      'x-desktop': JSON.stringify(!!window.electron),
    },
    onError({ error }) {
      if (
        error.status === 401 &&
        !router.state.location.pathname.startsWith('/auth')
      ) {
        // oxlint-disable-next-line no-use-before-define
        fullSignOut()
      }
    },
  },
  plugins: [organizationClient(), ...(window.electron ? [bearer()] : [])],
})

export const isSignedIn = async () => {
  const { data } = await tryCatchAsync(authClient.getSession)

  return !!data?.data?.user
}

export const fullSignOut = async () => {
  await authClient.signOut()
  bearerToken.clear()
  lastLocationStorageValue.clear()

  if (!router.state.location.pathname.startsWith('/auth')) {
    await router.navigate({ to: '/auth' })
  }

  const [{ cleanCollections }, { clearDb }] = await Promise.all([
    import('~/entities/collections'),
    import('./sync'),
  ])

  cleanCollections()
  await clearDb()
  await encryptionKey.reset()
}
