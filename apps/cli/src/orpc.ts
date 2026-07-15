import type { ORPCRouter } from '@tamery/api/orpc/routers'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'

import { getToken } from '~/config'

export const orpc = createORPCClient<ORPCRouter>(
  new RPCLink({
    url: `${import.meta.env.API_URL}/rpc`,
    headers: async () => {
      const token = getToken()

      return {
        Authorization: token ? `Bearer ${token}` : undefined,
      }
    },
  }),
)
