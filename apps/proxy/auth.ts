import { createAuthClient } from 'better-auth/client'
import { bearer } from 'better-auth/plugins'
import { env } from '~/env'

export const authClient = createAuthClient({
  baseURL: env.API_URL,
  basePath: '/auth',
  plugins: [bearer()],
  fetchOptions: {
    onRequest(request) {
      request.headers.delete('connection')
      request.headers.delete('content-length')
      request.headers.delete('host')
      request.headers.delete('transfer-encoding')
      return request
    },
  },
})
