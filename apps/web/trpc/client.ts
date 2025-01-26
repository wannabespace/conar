import type { CreateTRPCClientOptions } from '@trpc/client'
import type { AppRouter } from './routers'
import { createTRPCClient, unstable_httpBatchStreamLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import SuperJSON from 'superjson'
import { env } from '~/env'

export const clientConfig = {
  links: [
    unstable_httpBatchStreamLink({
      url: `${env.NEXT_PUBLIC_URL}/api/trpc`,
      transformer: SuperJSON,
    }),
  ],
} satisfies CreateTRPCClientOptions<AppRouter>

export const trpcReact = createTRPCReact<AppRouter>()
export const trpcClient = createTRPCClient<AppRouter>(clientConfig)
