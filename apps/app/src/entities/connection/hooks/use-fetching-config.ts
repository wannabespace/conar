import type { Connection } from '~/entities/connection/sync'
import { useSubscription } from 'seitu/react'
import { useConnectionStringInfo } from '~/lib/connection-string-storage'
import { useLocalProxyAvailable } from '../proxy'
import { getConnectionStore } from '../store'
import { fetchingConfig } from '../utils/fetching'

type Conn = Pick<Connection, 'id' | 'syncType' | 'passwordExists'>

export function useFetchingConfig(connection: Conn) {
  const isLocalProxyAvailable = useLocalProxyAvailable()
  const info = useConnectionStringInfo(connection.id)
  const proxy = useSubscription(getConnectionStore(connection.id), { selector: s => s.proxy })

  return fetchingConfig(connection, {
    isLocalProxyAvailable,
    isPasswordPopulated: info?.metadata?.isPasswordPopulated,
    isLocalhost: info?.metadata?.isLocalhost,
    proxy,
  })
}
