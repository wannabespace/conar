import type { ORPCRouter, router } from '@conar/api/orpc/routers'
import type { InferRouterInputs, InferRouterOutputs } from '@orpc/server'
import { createORPCClient, onError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { bearerToken } from './auth'
import { handleError } from './error'
import { apiUrl } from './utils'

const link = new RPCLink({
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
  fetch: window.electron
    ? undefined
    : (request, init) => {
        return globalThis.fetch(request, {
          ...init,
          credentials: 'include',
        })
      },
  interceptors: [
    onError(handleError),
  ],
})

export const client: ORPCRouter = createORPCClient(link)
export const orpc = createTanstackQueryUtils(client)

export type ORPCInputs = InferRouterInputs<typeof router>
export type ORPCOutputs = InferRouterOutputs<typeof router>
