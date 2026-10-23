import { PORTS } from '@tamery/shared/constants'
import { queryOptions, useQuery } from '@tanstack/react-query'

import { getSessionUser } from '~/lib/auth'
import { queryClient } from '~/lib/query-client'

const LOCAL_PROXY_HEALTH_KEY = ['proxy-health'] as const

const localProxyHealthQueryOptions = queryOptions({
  queryFn: async () => {
    try {
      const res = await fetch(`http://127.0.0.1:${PORTS.LOCAL_PROXY}/health`, {
        signal: AbortSignal.timeout(1500),
      })
      if (!res.ok) {
        return null
      }

      const health = (await res.json()) as {
        ok: boolean
        version: string
        userId: string
      }
      // Anything can listen on the port while `tamery proxy` is not running; it gets connection strings and the session token.
      const user = await getSessionUser()
      return health.userId === user?.id ? health : null
    } catch {
      return null
    }
  },
  queryKey: LOCAL_PROXY_HEALTH_KEY,
  refetchInterval: 10_000,
})

export const useLocalProxyAvailable = () => {
  const { data } = useQuery({
    ...localProxyHealthQueryOptions,
    enabled: !window.electron,
  })

  const available = data?.ok === true

  return available
}

export const isLocalProxyAvailable = (): boolean =>
  queryClient.getQueryData(localProxyHealthQueryOptions.queryKey)?.ok === true
