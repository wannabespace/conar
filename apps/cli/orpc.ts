import type * as apiOrpc from '@conar/api/orpc/routers'
import type * as proxyOrpc from '@conar/proxy/orpc/routers'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { getToken } from '~/config'
import { API_URL, PROXY_URL } from '~/env'

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const apiClient = createORPCClient(new RPCLink({
  url: `${API_URL}/rpc`,
  headers: authHeaders,
})) satisfies apiOrpc.ORPCRouter

export const proxyClient = createORPCClient(new RPCLink({
  url: `${PROXY_URL}/rpc`,
  headers: authHeaders,
})) satisfies proxyOrpc.ORPCRouter
