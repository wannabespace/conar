import { PORTS } from '@conar/shared/constants'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { queryClient } from '~/main'

const LOCAL_PROXY_HEALTH_KEY = ['local-proxy-health'] as const

const localProxyHealthQueryOptions = queryOptions({
  enabled: !window.electron,
  queryKey: LOCAL_PROXY_HEALTH_KEY,
  queryFn: async () => {
    try {
      const res = await fetch(`http://127.0.0.1:${PORTS.LOCAL_PROXY}/health`, {
        signal: AbortSignal.timeout(1500),
      })
      if (!res.ok)
        return null

      return await res.json() as {
        ok: boolean
        version: string
        userId: string
      }
    }
    catch {
      return null
    }
  },
  refetchInterval: 5000,
})

export function useLocalProxyAvailable() {
  const { data } = useQuery(localProxyHealthQueryOptions)

  const available = data?.ok === true

  return available
}

export function isLocalProxyAvailable(): boolean {
  return queryClient.getQueryData(localProxyHealthQueryOptions.queryKey)?.ok === true
}
