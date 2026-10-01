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
        fetch(url, init) {
          return fetch(url, {
            ...init,
            credentials: 'include',
          })
        },
        origin: import.meta.env.VITE_PUBLIC_API_URL,
        url: '/rpc',
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
        origin: import.meta.env.VITE_PUBLIC_API_URL,
        url: '/rpc',
      })
  )

export const orpc = createTanstackQueryUtils(
  createORPCClient<ORPCRouter>(getClientLink())
)
