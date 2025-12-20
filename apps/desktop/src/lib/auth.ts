import type { auth } from '@conar/api/src/lib/auth'
import { stripeClient } from '@better-auth/stripe/client'
import {
  inferAdditionalFields,
  lastLoginMethodClient,
  magicLinkClient,
  organizationClient,
  twoFactorClient,
} from 'better-auth/client/plugins'
import { bearer } from 'better-auth/plugins'
import { createAuthClient } from 'better-auth/react'
import { toast } from 'sonner'
import { clearDb } from '~/drizzle'
import { identifyUser } from './events'
import { getApiUrl } from './utils'

export const CODE_CHALLENGE_KEY = 'conar.code_challenge'
export const BEARER_TOKEN_KEY = 'conar.bearer_token'
export const RESET_TOKEN_KEY = 'conar.reset_token'

export const bearerToken = {
  get: () => localStorage.getItem(BEARER_TOKEN_KEY),
  set: (bearerToken: string) => localStorage.setItem(BEARER_TOKEN_KEY, bearerToken),
  remove: () => localStorage.removeItem(BEARER_TOKEN_KEY),
}

export const resetToken = {
  get: () => sessionStorage.getItem(RESET_TOKEN_KEY),
  set: (resetToken: string) => sessionStorage.setItem(RESET_TOKEN_KEY, resetToken),
  remove: () => sessionStorage.removeItem(RESET_TOKEN_KEY),
}

export const codeChallenge = {
  get: () => sessionStorage.getItem(CODE_CHALLENGE_KEY),
  set: (codeChallenge: string) => sessionStorage.setItem(CODE_CHALLENGE_KEY, codeChallenge),
  remove: () => sessionStorage.removeItem(CODE_CHALLENGE_KEY),
}

export function successAuthToast(newUser: boolean) {
  toast.success(
    newUser
      ? "Welcome to Conar! We're excited to help you manage your connections with ease. Get started by creating your first connection."
      : 'Welcome back! Your connections are ready for you.',
    {
      duration: 10000,
    }
  )
}

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  basePath: '/auth',
  plugins: [
    inferAdditionalFields<typeof auth>(),
    stripeClient({ subscription: true }),
    bearer(),
    organizationClient(),
    twoFactorClient(),
    magicLinkClient(),
    lastLoginMethodClient(),
  ],
  fetchOptions: {
    auth: {
      type: 'Bearer',
      token: () => bearerToken.get() ?? undefined,
    },
    headers: {
      'x-desktop': 'true',
    },
    async onError({ error }) {
      if (error.status === 401) {
        fullSignOut()
      }
    },
  },
})

export async function fullSignOut() {
  await authClient.signOut()
  bearerToken.remove()
  clearDb()
  identifyUser(null)
}
