import type { auth } from '@connnect/web/auth-type'
import { createAuthClient } from 'better-auth/client'
import { inferAdditionalFields, organizationClient, twoFactorClient } from 'better-auth/client/plugins'
import { env } from '~/env'
import { secretParse, secretStringify } from './secrets'

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

export async function getCodeChallenge() {
  const secret = localStorage.getItem(CODE_CHALLENGE_KEY)

  if (!secret) {
    return null
  }

  return await secretParse<string>(secret, env.VITE_PUBLIC_AUTH_SECRET)
}

export async function parseCodeChallenge(codeChallenge: string) {
  return await secretParse<string>(codeChallenge, env.VITE_PUBLIC_AUTH_SECRET)
}

export async function saveAndReturnCodeChallenge(codeChallenge: string) {
  const secret = await secretStringify(codeChallenge, env.VITE_PUBLIC_AUTH_SECRET)

  localStorage.setItem(CODE_CHALLENGE_KEY, secret)

  return secret
}

export function removeCodeChallenge() {
  localStorage.removeItem(CODE_CHALLENGE_KEY)
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
  },
  plugins: [
    organizationClient(),
    twoFactorClient(),
    inferAdditionalFields<typeof auth>(),
  ],
})
