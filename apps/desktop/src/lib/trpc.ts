import type { AppRouter } from '@connnect/web/trpc-type'
import type { CreateTRPCClientOptions } from '@trpc/client'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import SuperJSON from 'superjson'
import { env } from '../env'

export const clientConfig = {
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: `${env.VITE_PUBLIC_APP_URL}/api/trpc`,
    }),
  ],
} satisfies CreateTRPCClientOptions<AppRouter>

export const trpcReact = createTRPCReact<AppRouter>()
export const trpcClient = createTRPCProxyClient<AppRouter>(clientConfig)
