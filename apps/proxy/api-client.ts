import type { ORPCRouter } from '@conar/api/orpc/routers'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'

import { env } from './env'

export function createApiClient(options: { authorization?: string | null; cookie?: string | null }): ORPCRouter {
  return createORPCClient(
    new RPCLink({
      url: `${env.API_URL}/rpc`,
      headers: () => ({
        ...(options.authorization ? { authorization: options.authorization } : {}),
        ...(options.cookie ? { cookie: options.cookie } : {}),
        'x-proxy-token': env.PROXY_SHARED_SECRET,
      }),
    }),
  )
}
