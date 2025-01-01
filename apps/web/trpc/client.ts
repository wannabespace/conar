import type { AppRouter } from './routers'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import SuperJSON from 'superjson'
import { env } from '~/env'

export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: `${env.NEXT_PUBLIC_URL}/api/trpc`,
    }),
  ],
})
