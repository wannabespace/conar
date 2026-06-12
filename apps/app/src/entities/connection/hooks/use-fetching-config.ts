import type { Connection } from '~/entities/connection/sync'
import { useSubscription } from 'seitu/react'
import { useConnectionString } from '~/lib/connection-string-storage'
import { useLocalProxyAvailable } from '../proxy'
import { getConnectionStore } from '../store'
import { fetchingConfig } from '../utils/fetching'

export function useFetchingConfig(connection: Pick<Connection, 'id' | 'syncType' | 'passwordExists'>) {
  const isLocalProxyAvailable = useLocalProxyAvailable()
  const connectionString = useConnectionString(connection.id)
  const proxy = useSubscription(getConnectionStore(connection.id), { selector: s => s.proxy })

  return fetchingConfig(connection, {
    isLocalProxyAvailable,
    isPasswordPopulated: connectionString?.metadata.isPasswordPopulated,
    isLocalhost: connectionString?.metadata.isLocalhost,
    proxy,
  })
}
