import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ORPCRouter } from '@tamery/api/orpc/routers'

import { env } from './env'

export const createApiClient = (options: {
  authorization?: string | null
  cookie?: string | null
}): ORPCRouter =>
  createORPCClient(
    new RPCLink({
      headers: () => ({
        ...(options.authorization
          ? { authorization: options.authorization }
          : {}),
        ...(options.cookie ? { cookie: options.cookie } : {}),
        'x-proxy-token': env.PROXY_SHARED_SECRET,
      }),
      url: `${env.API_URL}/rpc`,
    })
  )
