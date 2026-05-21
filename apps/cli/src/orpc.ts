import type * as apiOrpc from '@conar/api/orpc/routers'
import type { InferRouterInputs, InferRouterOutputs } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { getToken } from '~/config'

const clientId = crypto.randomUUID()

export const orpc = createORPCClient(new RPCLink({
  url: `${import.meta.env.API_URL}/rpc`,
  headers: async () => {
    const token = getToken()

    return {
      'Authorization': token ? `Bearer ${token}` : undefined,
      'x-client-id': clientId,
    }
  },
})) satisfies apiOrpc.ORPCRouter

export type ORPCInputs = InferRouterInputs<typeof apiOrpc.router>
export type ORPCOutputs = InferRouterOutputs<typeof apiOrpc.router>
