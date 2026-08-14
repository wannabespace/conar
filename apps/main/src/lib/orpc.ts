import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import type { ORPCRouter } from '@tamery/api/orpc/routers'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

const getClientLink = createIsomorphicFn()
  .client(
    () =>
      new RPCLink({
        fetch(request, init) {
          return fetch(request, {
            ...init,
            credentials: 'include',
          })
        },
        url: `${import.meta.env.VITE_PUBLIC_API_URL}/rpc`,
      })
  )
  .server(
    () =>
      new RPCLink({
        headers: () => {
          const request = getRequest()

          return {
            cookie: request.headers.get('cookie') ?? '',
          }
        },
        url: `${import.meta.env.VITE_PUBLIC_API_URL}/rpc`,
      })
  )

export const orpc = createTanstackQueryUtils(
  createORPCClient<ORPCRouter>(getClientLink())
)
