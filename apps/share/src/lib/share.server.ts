import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ORPCRouter } from '@tamery/proxy/orpc/routers'
import { querySerializer } from '@tamery/query-proxy/serializer'
import { valueToText } from '@tamery/shared/value-text'
import { getCookie, setCookie } from '@tanstack/react-start/server'

const PASSWORD_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

export const proxy: ORPCRouter = createORPCClient(
  new RPCLink({
    origin: import.meta.env.VITE_PUBLIC_PROXY_URL,
    serializer: querySerializer,
    url: '/rpc',
  })
)

export const sharePassword = {
  get: (shareId: string) => getCookie(sharePassword.key(shareId)) ?? null,
  key: (shareId: string) => `share-${shareId}`,
  set: (shareId: string, password: string) =>
    setCookie(sharePassword.key(shareId), password, {
      httpOnly: true,
      maxAge: PASSWORD_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure: true,
    }),
}

export const cellText = (value: unknown) =>
  value === null || value === undefined ? null : valueToText(value)
