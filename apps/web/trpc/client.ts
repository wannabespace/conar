import type { CreateTRPCClientOptions } from '@trpc/client'
import type { CreateTRPCReact } from '@trpc/react-query'
import type { Context } from './context'
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

// eslint-disable-next-line ts/no-explicit-any
export const trpcReact: CreateTRPCReact<AppRouter, Context, any> = createTRPCReact()
export const trpcClient = createTRPCProxyClient<AppRouter>(clientConfig)
