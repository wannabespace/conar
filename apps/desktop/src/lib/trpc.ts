import type { AppRouter, RouterInputs, RouterOutputs } from '@connnect/api/src/trpc/routers'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import SuperJSON from 'superjson'
import { getBearerToken } from '~/lib/auth'
import { handleError } from '~/lib/error'

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_PUBLIC_API_URL}/trpc`,
      transformer: SuperJSON,
      async fetch(...args) {
        const response = await fetch(...args)

        if (response.status === 401) {
          handleError(response)
        }

        return response
      },
      headers: async () => {
        const token = getBearerToken()

        return {
          Authorization: token ? `Bearer ${token}` : undefined,
        }
      },
    }),
  ],
})
export type { RouterInputs, RouterOutputs }
