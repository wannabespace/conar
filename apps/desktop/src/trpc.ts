import type { AppRouter } from '@connnect/web/trpc-type'
import type { CreateTRPCClientOptions } from '@trpc/client'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import SuperJSON from 'superjson'
import { env } from '~/env'
import { getBearerToken } from '~/lib/auth'
import { handleError } from '~/lib/error'

export const clientConfig = {
  links: [
    httpBatchLink({
      url: `${env.VITE_PUBLIC_APP_URL}/api/trpc`,
      transformer: SuperJSON,
      async fetch(...args) {
        const response = await fetch(...args)

        if (response.status === 401) {
          handleError(response)
        }

        return response
      },
      headers: async () => {
        const token = getBearerToken()

        return {
          Authorization: token ? `Bearer ${token}` : undefined,
        }
      },
    }),
  ],
} satisfies CreateTRPCClientOptions<AppRouter>

export const trpc = createTRPCClient<AppRouter>(clientConfig)
