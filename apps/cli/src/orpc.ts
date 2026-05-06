import type * as apiOrpc from '@conar/api/orpc/routers'
import type { InferRouterInputs, InferRouterOutputs } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { getToken } from '~/config'

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const orpc = createORPCClient(new RPCLink({
  url: `${import.meta.env.API_URL}/rpc`,
  headers: authHeaders,
})) satisfies apiOrpc.ORPCRouter

export type ORPCInputs = InferRouterInputs<typeof apiOrpc.router>
export type ORPCOutputs = InferRouterOutputs<typeof apiOrpc.router>
