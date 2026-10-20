import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ORPCRouter } from '@tamery/api/orpc/routers'
import { getRequest } from '@tanstack/react-start/server'
import { type } from 'arktype'

const cookie = () => getRequest().headers.get('cookie') ?? ''

export const api: ORPCRouter = createORPCClient(
  new RPCLink({
    headers: () => ({ cookie: cookie() }),
    origin: import.meta.env.VITE_PUBLIC_API_URL,
    url: '/rpc',
  })
)

const sessionResponse = type({
  user: { email: 'string', isAnonymous: 'boolean | null' },
}).or('null')

export const getSessionUser = async () => {
  const response = await fetch(
    `${import.meta.env.VITE_PUBLIC_API_URL}/auth/get-session`,
    { headers: { cookie: cookie() } }
  )
  const session = sessionResponse(response.ok ? await response.json() : null)
  if (session instanceof type.errors || !session || session.user.isAnonymous) {
    return null
  }
  return { email: session.user.email }
}
