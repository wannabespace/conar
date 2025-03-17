import type { auth } from '@connnect/web/src/lib/auth'
import { createAuthClient } from 'better-auth/client'
import {
  inferAdditionalFields,
  magicLinkClient,
  organizationClient,
  twoFactorClient,
} from 'better-auth/client/plugins'
import { toast } from 'sonner'

export const BEARER_TOKEN_KEY = 'connnect.bearer_token'
export const CODE_CHALLENGE_KEY = 'connnect.code_challenge'

export function removeBearerToken() {
  localStorage.removeItem(BEARER_TOKEN_KEY)
}

export function getBearerToken() {
  return localStorage.getItem(BEARER_TOKEN_KEY)
}

export function setBearerToken(token: string) {
  localStorage.setItem(BEARER_TOKEN_KEY, token)
}

export function getCodeChallenge() {
  return localStorage.getItem(CODE_CHALLENGE_KEY)
}

export function setCodeChallenge(codeChallenge: string) {
  localStorage.setItem(CODE_CHALLENGE_KEY, codeChallenge)
}

export function removeCodeChallenge() {
  localStorage.removeItem(CODE_CHALLENGE_KEY)
}

export function successAuthToast(newUser: boolean) {
  toast.success(
    newUser
      ? 'Welcome to Connnect! We\'re excited to help you manage your connections with ease. Get started by creating your first connection.'
      : 'Welcome back! Your connections are ready for you.',
    {
      duration: 5000,
    },
  )
}

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_PUBLIC_APP_URL,
  fetchOptions: {
    async onRequest({ headers }) {
      const token = getBearerToken()

      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    },
    async onSuccess({ response }) {
      const authToken = response.headers.get('set-auth-token')

      if (authToken) {
        setBearerToken(authToken)
      }
    },
    async onError({ error }) {
      if (error.status === 401) {
        removeBearerToken()
      }
    },
  },
  plugins: [
    inferAdditionalFields<typeof auth>(),
    organizationClient(),
    twoFactorClient(),
    magicLinkClient(),
  ],
})
