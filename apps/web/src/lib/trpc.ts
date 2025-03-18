import type { AppRouter } from '@connnect/api/src/trpc/routers'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import SuperJSON from 'superjson'

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_PUBLIC_API_URL}/trpc`,
      transformer: SuperJSON,
    }),
  ],
})
