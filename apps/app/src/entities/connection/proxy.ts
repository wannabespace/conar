import { PORTS } from '@conar/shared/constants'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { queryClient } from '~/main'

const LOCAL_PROXY_HEALTH_KEY = ['proxy-health'] as const

const localProxyHealthQueryOptions = queryOptions({
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
  refetchInterval: 10_000,
})

export function useLocalProxyAvailable() {
  const { data } = useQuery({
    ...localProxyHealthQueryOptions,
    // TODO: remove in future, electron will also have a proxy
    enabled: !window.electron,
  })

  const available = data?.ok === true

  return available
}

export function isLocalProxyAvailable(): boolean {
  return queryClient.getQueryData(localProxyHealthQueryOptions.queryKey)?.ok === true
}
