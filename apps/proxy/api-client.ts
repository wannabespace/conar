import type { ORPCRouter } from '@conar/api/orpc/routers'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { memoize } from 'memoza'
import { env } from './env'

export const createApiClient = memoize((options: {
  authorization?: string | null
  cookie?: string | null
}): ORPCRouter => {
  return createORPCClient(new RPCLink({
    url: `${env.API_URL}/rpc`,
    fetch: (request, init) => {
      return globalThis.fetch(request, {
        ...init,
        headers: {
          ...(options.authorization ? { authorization: options.authorization } : {}),
          ...(options.cookie ? { cookie: options.cookie } : {}),
          'x-proxy-token': env.PROXY_SHARED_SECRET,
        },
      })
    },
  }))
})
