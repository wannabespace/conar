import type { ORPCRouter } from '@conar/api/src/orpc/routers'
import { createORPCClient, onError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { bearerToken } from './auth'
import { handleError } from './error'

const link = new RPCLink({
  url: `${import.meta.env.VITE_PUBLIC_API_URL}/rpc`,
  headers: () => {
    const token = bearerToken.get()

    return {
      'Authorization': token ? `Bearer ${token}` : undefined,
      'x-desktop': 'true',
    }
  },
  interceptors: [
    onError(handleError),
  ],
})

export const orpc: ORPCRouter = createORPCClient(link)
