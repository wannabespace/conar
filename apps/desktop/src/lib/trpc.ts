import type { AppRouter } from '@connnect/web/trpc-type'
import type { CreateTRPCClientOptions } from '@trpc/client'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import SuperJSON from 'superjson'
import { env } from '../env'
import { getBearerToken } from './auth'

export const clientConfig = {
  links: [
    httpBatchLink({
      url: `${env.VITE_PUBLIC_APP_URL}/api/trpc`,
      transformer: SuperJSON,
      headers: async () => {
        const token = await getBearerToken()

        if (!token) {
          return {}
        }

        return {
          Authorization: `Bearer ${token}`,
        }
      },
    }),
  ],
} satisfies CreateTRPCClientOptions<AppRouter>

export const trpcReact = createTRPCReact<AppRouter>()
export const trpc = createTRPCClient<AppRouter>(clientConfig)
