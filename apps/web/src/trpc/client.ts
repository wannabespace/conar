import type { AppRouter } from './routers'
import { createTRPCClient, unstable_httpBatchStreamLink } from '@trpc/client'
import SuperJSON from 'superjson'
import { env } from '~/lib/env-client'

export const trpc = createTRPCClient<AppRouter>({
  links: [
    unstable_httpBatchStreamLink({
      url: `${env.VITE_PUBLIC_URL}/api/trpc`,
      transformer: SuperJSON,
    }),
  ],
})
