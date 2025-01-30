import type { AppRouter } from '@connnect/web/trpc-type'
import type { CreateTRPCClientOptions } from '@trpc/client'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import SuperJSON from 'superjson'
import { env } from '../env'
import { getBearerToken } from './auth'
import { handleError } from './error'

export const clientConfig = {
  links: [
    httpBatchLink({
      url: `${env.VITE_PUBLIC_APP_URL}/api/trpc`,
      transformer: SuperJSON,
      async fetch(...args) {
        try {
          return await fetch(...args)
        }
        catch (error) {
          handleError(error)
          throw error
        }
      },
      headers: async () => {
        const token = await getBearerToken()

        return {
          cookie: window.document.cookie,
          Authorization: token ? `Bearer ${token}` : undefined,
        }
      },
    }),
  ],
} satisfies CreateTRPCClientOptions<AppRouter>

export const trpc = createTRPCClient<AppRouter>(clientConfig)
