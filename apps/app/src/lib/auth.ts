import { tryCatchAsync } from '@tamery/shared/utils'
import { type } from 'arktype'
import { anonymousClient, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { createWebStorageValue } from 'seitu/web'
import { toast } from 'sonner'

import { encryptionKey } from './encryption-key'
import {
  history,
  isAuthLocation,
  lastLocationStorageValue,
} from './last-location'
import { apiUrl } from './urls'

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
      if (error.status === 401 && !isAuthLocation()) {
        // oxlint-disable-next-line no-use-before-define
        fullSignOut()
      }
    },
  },
  plugins: [anonymousClient(), organizationClient()],
})

export const isAnonymous = () =>
  !!authClient.$store.atoms.session?.get().data?.user.isAnonymous

export const useIsAnonymous = () =>
  !!authClient.useSession().data?.user.isAnonymous

export const isSignedIn = async () => {
  const { data } = await tryCatchAsync(authClient.getSession)

  return !!data?.data?.user
}

export const fullSignOut = async () => {
  await authClient.signOut()
  bearerToken.clear()
  lastLocationStorageValue.clear()

  if (!isAuthLocation()) {
    history.push('/auth')
  }

  const [{ cleanCollections }, { clearDb }, { resetAccess }] =
    await Promise.all([
      import('~/core/collections'),
      import('./sync'),
      import('~/core/user/permissions'),
    ])

  cleanCollections()
  resetAccess()
  await Promise.all([clearDb(), encryptionKey.reset()])
}
