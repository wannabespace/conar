import { bearer } from 'better-auth/plugins'
import { createAuthClient } from 'better-auth/react'
import { toast } from 'sonner'
import { clearDb } from '~/drizzle'
import { identifyUser } from './events'
import { apiUrl } from './utils'

const BEARER_TOKEN_KEY = 'conar.bearer_token'

export const bearerToken = {
  get: () => localStorage.getItem(BEARER_TOKEN_KEY),
  set: (bearerToken: string) => localStorage.setItem(BEARER_TOKEN_KEY, bearerToken),
  remove: () => localStorage.removeItem(BEARER_TOKEN_KEY),
}

export function successAuthToast(newUser: boolean) {
  toast.success(
    newUser
      ? 'Welcome to Conar! We\'re excited to help you manage your connections with ease. Get started by creating your first connection.'
      : 'Welcome back! Your connections are ready for you.',
    {
      duration: 10000,
    },
  )
}

export const authClient = createAuthClient({
  baseURL: apiUrl,
  basePath: '/auth',
  plugins: [
    bearer(),
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
