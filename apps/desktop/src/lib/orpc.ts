import type { ORPCRouter, router } from '@conar/api/src/orpc/routers'
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { bearerToken } from './auth'
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
})

export const orpc: ORPCRouter = createORPCClient(link)
export const orpcQuery = createTanstackQueryUtils(orpc)

export type ORPCInputs = InferContractRouterInputs<typeof router>
export type ORPCOutputs = InferContractRouterOutputs<typeof router>
