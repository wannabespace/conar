import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ORPCRouter } from '@tamery/proxy/orpc/routers'
import { querySerializer } from '@tamery/query-proxy/serializer'
import { getCookie, setCookie } from '@tanstack/react-start/server'

const UNLOCK_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

export const proxy: ORPCRouter = createORPCClient(
  new RPCLink({
    origin: import.meta.env.VITE_PUBLIC_PROXY_URL,
    serializer: querySerializer,
    url: '/rpc',
  })
)

export const unlockToken = {
  get: (shareId: string) => getCookie(unlockToken.key(shareId)) ?? null,
  key: (shareId: string) => `share-${shareId}`,
  set: (shareId: string, token: string) =>
    setCookie(unlockToken.key(shareId), token, {
      httpOnly: true,
      maxAge: UNLOCK_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure: true,
    }),
}
