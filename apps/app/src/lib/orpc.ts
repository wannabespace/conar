import type * as apiOrpc from '@conar/api/orpc/routers'
import type * as proxyOrpc from '@conar/proxy/orpc/routers'
import type * as queryProxy from '@conar/query-proxy'
import type { InferRouterInputs, InferRouterOutputs } from '@orpc/server'
import { PORTS } from '@conar/shared/constants'
import { createORPCClient, onError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { bearerToken } from './auth'
import { handleError } from './error'
import { apiUrl, proxyUrl } from './utils'

export const orpc = createTanstackQueryUtils(createORPCClient(new RPCLink({
  url: `${apiUrl}/rpc`,
  headers: async () => {
    const token = bearerToken.get()

    return {
      Authorization: token ? `Bearer ${token}` : undefined,
      ...(window.electron
        ? {
            'x-desktop': 'true',
            'x-desktop-version': await window.electron.versions.app(),
          }
        : {}),
    }
  },
  fetch: (request, init) => {
    return globalThis.fetch(request, {
      ...init,
      credentials: 'include',
    })
  },
  interceptors: [
    onError(handleError),
  ],
})) satisfies apiOrpc.ORPCRouter)

export const orpcProxy = createORPCClient(new RPCLink({
  url: `${proxyUrl}/rpc`,
  headers: async () => {
    const token = bearerToken.get()

    return {
      Authorization: token ? `Bearer ${token}` : undefined,
    }
  },
  fetch: (request, init) => {
    return globalThis.fetch(request, {
      ...init,
      credentials: 'include',
    })
  },
})) satisfies proxyOrpc.ORPCRouter

export const orpcLocalProxy = createORPCClient(new RPCLink({
  url: `http://localhost:${PORTS.LOCAL_PROXY}`,
  headers: async () => {
    const token = bearerToken.get()
    return {
      Authorization: token ? `Bearer ${token}` : undefined,
    }
  },
  fetch: (request, init) => {
    return globalThis.fetch(request, {
      ...init,
      credentials: 'include',
    })
  },
})) satisfies queryProxy.ORPCRouter

export type ORPCInputs = InferRouterInputs<typeof apiOrpc.router>
export type ORPCOutputs = InferRouterOutputs<typeof apiOrpc.router>
