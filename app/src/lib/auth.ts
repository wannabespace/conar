import { createAuthClient } from 'better-auth/react'
import { BEARER_TOKEN_KEY } from '~/lib/constants'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_PUBLIC_URL,
  fetchOptions: {
    auth: {
      type: 'Bearer',
      token: () => localStorage.getItem(BEARER_TOKEN_KEY) ?? undefined,
    },
    credentials: 'omit',
  },
})
