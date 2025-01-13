import type { auth } from '@connnect/web/auth-type'
import { isTauri } from '@tauri-apps/api/core'
import { createAuthClient } from 'better-auth/client'
import { inferAdditionalFields, organizationClient, twoFactorClient } from 'better-auth/client/plugins'
import { toast } from 'sonner'
import { env } from '~/env'

export const BEARER_TOKEN_KEY = 'connnect.bearer_token'
export const CODE_CHALLENGE_KEY = 'connnect.code_challenge'

export async function removeBearerToken() {
  localStorage.removeItem(BEARER_TOKEN_KEY)
}

export async function getBearerToken() {
  return localStorage.getItem(BEARER_TOKEN_KEY)
}

export async function setBearerToken(token: string) {
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

export function successToast(newUser: boolean) {
  toast.success(
    newUser
      ? 'Welcome to Connnect! We\'re excited to help you manage your databases with ease. Get started by creating your first connection.'
      : 'Welcome back! Your database connections are ready for you.',
    {
      duration: 5000,
    },
  )
}

export const authClient = createAuthClient({
  baseURL: env.VITE_PUBLIC_APP_URL,
  fetchOptions: {
    async onRequest(context) {
      const token = await getBearerToken()

      if (token) {
        context.headers.set('Authorization', `Bearer ${token}`)
      }
    },
    async onSuccess({ response }) {
      if (!isTauri()) {
        return
      }

      const authToken = response.headers.get('set-auth-token')

      if (authToken) {
        await setBearerToken(authToken)
      }
    },
  },
  plugins: [
    organizationClient(),
    twoFactorClient(),
    inferAdditionalFields<typeof auth>(),
  ],
})
