import type { auth } from '@connnect/web/auth-type'
import { createAuthClient } from 'better-auth/client'
import { inferAdditionalFields, magicLinkClient, organizationClient, twoFactorClient } from 'better-auth/client/plugins'
import { toast } from 'sonner'
import { env } from '~/env'
import { kv } from './kv-storage'

export const BEARER_TOKEN_KEY = 'connnect.bearer_token'
export const CODE_CHALLENGE_KEY = 'connnect.code_challenge'

export async function removeBearerToken() {
  await kv.remove(BEARER_TOKEN_KEY)
}

export async function getBearerToken() {
  return kv.get<string>(BEARER_TOKEN_KEY)
}

export async function setBearerToken(token: string) {
  await kv.set(BEARER_TOKEN_KEY, token)
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
  baseURL: env.VITE_PUBLIC_APP_URL,
  fetchOptions: {
    async onRequest(context) {
      const token = await getBearerToken()

      if (token) {
        context.headers.set('Authorization', `Bearer ${token}`)
      }
    },
    async onSuccess({ response }) {
      const authToken = response.headers.get('set-auth-token')

      if (authToken) {
        await setBearerToken(authToken)
      }
    },
  },
  plugins: [
    organizationClient(),
    twoFactorClient(),
    magicLinkClient(),
    inferAdditionalFields<typeof auth>(),
  ],
})
