import type { AppRouter } from '@connnect/web/trpc-type'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/react-query'
import SuperJSON from 'superjson'
import { env } from '~/env'

export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: `${env.VITE_PUBLIC_API_URL}/api/trpc`,
    }),
  ],
})
