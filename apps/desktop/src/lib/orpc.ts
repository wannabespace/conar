import type { ORPCRouter } from '@conar/api/src/orpc/routers'
import { createORPCClient, onError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { bearerToken } from './auth'
import { handleError } from './error'
import { getApiUrl } from './utils'

const link = new RPCLink({
  url: `${getApiUrl()}/rpc`,
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
  interceptors: [
    onError(handleError),
  ],
})

export const orpc: ORPCRouter = createORPCClient(link)
export const orpcQuery = createTanstackQueryUtils(orpc)
