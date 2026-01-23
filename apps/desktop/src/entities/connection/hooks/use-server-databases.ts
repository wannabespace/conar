import type { connections } from '~/drizzle'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { listDatabasesQuery } from '../sql/list-databases'

const connectionSystemNames = {
  [ConnectionType.Postgres]: 'postgres',
  [ConnectionType.MySQL]: 'mysql',
  [ConnectionType.MSSQL]: 'master',
  [ConnectionType.ClickHouse]: 'default',
} satisfies Record<ConnectionType, string>

export function useServerConnections(connection: typeof connections.$inferSelect) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: databasesList = [], isLoading } = useQuery({
    queryKey: ['server-databases', connection.id],
    throwOnError: false,
    retry: 5,
    queryFn: async () => {
      const url = new SafeURL(connection.connectionString)
      url.pathname = connectionSystemNames[connection.type]

      const systemConnection = {
        ...connection,
        connectionString: url.toString(),
      }

      const dbNames = await listDatabasesQuery(systemConnection)
      const currentDbName = new SafeURL(connection.connectionString).pathname.replace(/^\//, '')
      return dbNames.filter(name => name !== currentDbName)
    },
  })

  const toggleExpand = () => setIsExpanded(prev => !prev)

  return {
    isExpanded,
    isLoading,
    databasesList,
    toggleExpand,
    setIsExpanded,
  }
}
