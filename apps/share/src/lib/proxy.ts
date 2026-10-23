import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ORPCRouter } from '@tamery/proxy/orpc/routers'
import { querySerializer } from '@tamery/query-proxy/serializer'

export const proxy: ORPCRouter = createORPCClient(
  new RPCLink({
    origin: import.meta.env.VITE_PUBLIC_PROXY_URL,
    serializer: querySerializer,
    url: '/rpc',
  })
)
