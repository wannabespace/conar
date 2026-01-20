import type { ORPCRouter } from '@conar/api/orpc/routers'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

const getClientLink = createIsomorphicFn()
  .client(() => new RPCLink({
    url: `${import.meta.env.VITE_PUBLIC_API_URL}/rpc`,
    fetch(request, init) {
      return fetch(request, {
        ...init,
        credentials: 'include',
      })
    },
  }))
  .server(() => new RPCLink({
    url: `${import.meta.env.VITE_PUBLIC_API_URL}/rpc`,
    headers: () => {
      const request = getRequest()

      return {
        cookie: request.headers.get('cookie') ?? '',
      }
    },
  }))

export const orpc: ORPCRouter = createORPCClient(getClientLink())
export const orpcQuery = createTanstackQueryUtils(orpc)
