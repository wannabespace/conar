import type { CreateTRPCClientOptions } from '@trpc/client'
import type { AppRouter } from './routers'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import SuperJSON from 'superjson'
import { env } from '~/env'

export const clientConfig = {
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: `${env.NEXT_PUBLIC_URL}/api/trpc`,
    }),
  ],
} satisfies CreateTRPCClientOptions<AppRouter>

export const trpcReact = createTRPCReact<AppRouter>()
export const trpcClient = createTRPCProxyClient<AppRouter>(clientConfig)
