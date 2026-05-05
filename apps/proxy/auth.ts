import { createAuthClient } from 'better-auth/client'
import { bearer } from 'better-auth/plugins'
import { env } from '~/env'

export const authClient = createAuthClient({
  baseURL: env.API_URL,
  basePath: '/auth',
  plugins: [bearer()],
  fetchOptions: {
    customFetchImpl: (input, init) => globalThis.fetch(input, {
      ...init,
      verbose: true,
    }),
  },
})
