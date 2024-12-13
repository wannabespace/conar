import { createAuthClient } from 'better-auth/client'
import { env } from '~/env'
import { BEARER_TOKEN_KEY } from './constants'

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_URL,
  fetchOptions: {
    auth: {
      type: 'Bearer',
      token: () => localStorage.getItem(BEARER_TOKEN_KEY) ?? undefined,
    },
  },
})
