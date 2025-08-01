import type { AppRouter, RouterInputs, RouterOutputs } from '@conar/api/src/trpc/routers'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import SuperJSON from 'superjson'
import { handleError } from '~/lib/error'
import { bearerToken } from './auth'

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_PUBLIC_API_URL}/trpc`,
      transformer: SuperJSON,
      async fetch(input, init) {
        const response = await fetch(input, {
          ...init,
          body: init?.body as BodyInit,
          credentials: 'include',
        })

        if (response.status === 401) {
          handleError({
            status: response.status,
            code: 'UNAUTHORIZED',
            message: await response.text(),
          })
        }

        return response
      },
      headers() {
        const token = bearerToken.get()

        return {
          Authorization: token ? `Bearer ${token}` : undefined,
        }
      },
    }),
  ],
})
export type { RouterInputs, RouterOutputs }
