import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ORPCRouter } from '@tamery/api/orpc/routers'

import { getToken } from '~/config'

export const orpc = createORPCClient<ORPCRouter>(
  new RPCLink({
    headers: () => {
      const token = getToken()

      return {
        Authorization: token ? `Bearer ${token}` : undefined,
      }
    },
    url: `${import.meta.env.API_URL}/rpc`,
  })
)
