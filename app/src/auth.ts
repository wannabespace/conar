import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_PUBLIC_URL,
  fetchOptions: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('connnect.bearer_token')}`,
    },
    credentials: 'omit',
  },
})
