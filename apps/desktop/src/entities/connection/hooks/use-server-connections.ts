import type { connections } from '~/drizzle'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { listServerConnectionsQuery } from '../sql/list-server-connections'

const connectionSystemNames = {
  [ConnectionType.Postgres]: 'postgres',
  [ConnectionType.MySQL]: 'mysql',
  [ConnectionType.MSSQL]: 'master',
  [ConnectionType.ClickHouse]: 'default',
} satisfies Record<ConnectionType, string>

export function useServerConnections(connection: typeof connections.$inferSelect) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: connectionNamesList = [], isLoading } = useQuery({
    queryKey: ['server-connections', connection.id],
    throwOnError: false,
    retry: 5,
    queryFn: async () => {
      const url = new SafeURL(connection.connectionString)
      url.pathname = connectionSystemNames[connection.type]

      const systemConnection = {
        ...connection,
        connectionString: url.toString(),
      }

      const connectionNames = await listServerConnectionsQuery(systemConnection)
      const currentConnectionName = new SafeURL(connection.connectionString).pathname.replace(/^\//, '')
      return connectionNames.filter(name => name !== currentConnectionName)
    },
  })

  const toggleExpand = () => setIsExpanded(prev => !prev)

  return {
    isExpanded,
    isLoading,
    connectionNamesList,
    toggleExpand,
    setIsExpanded,
  }
}
