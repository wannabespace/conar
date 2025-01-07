import type { AppRouter } from '@connnect/web/trpc-type'
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
}

export const trpcReact = createTRPCReact<AppRouter>()
export const trpc = createTRPCProxyClient<AppRouter>(clientConfig)
