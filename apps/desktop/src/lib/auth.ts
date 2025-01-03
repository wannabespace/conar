import type { auth } from '@connnect/web/auth-type'
import { createAuthClient } from 'better-auth/client'
import { inferAdditionalFields, organizationClient, twoFactorClient } from 'better-auth/client/plugins'
import { env } from '~/env'

export const BEARER_TOKEN_KEY = 'connnect.bearer_token'

export async function removeBearerToken() {
  if (env.VITE_PUBLIC_IS_DESKTOP) {
    localStorage.removeItem(BEARER_TOKEN_KEY)
  }
}

export async function getBearerToken() {
  if (env.VITE_PUBLIC_IS_DESKTOP) {
    return localStorage.getItem(BEARER_TOKEN_KEY)
  }

  return null
}

export async function setBearerToken(token: string) {
  if (env.VITE_PUBLIC_IS_DESKTOP) {
    localStorage.setItem(BEARER_TOKEN_KEY, token)
  }
}

export const authClient = createAuthClient({
  baseURL: env.VITE_PUBLIC_API_URL,
  fetchOptions: {
    async onRequest(context) {
      const token = await getBearerToken()

      if (token) {
        context.headers.set('Authorization', `Bearer ${token}`)
      }
    },
  },
  plugins: [
    organizationClient(),
    twoFactorClient(),
    inferAdditionalFields<typeof auth>(),
  ],
})
