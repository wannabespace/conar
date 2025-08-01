import type { router } from '@conar/api/src/orpc/routers'
import type { RouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { bearerToken } from './auth'
import { handleError } from './error'

const link = new RPCLink({
  url: `${import.meta.env.VITE_PUBLIC_API_URL}/rpc`,
  fetch: async (request, init) => {
    const response = await fetch(request, {
      ...init,
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
  headers: () => {
    const token = bearerToken.get()

    return {
      Authorization: token ? `Bearer ${token}` : undefined,
    }
  },
})

export const orpc: RouterClient<typeof router> = createORPCClient(link)
