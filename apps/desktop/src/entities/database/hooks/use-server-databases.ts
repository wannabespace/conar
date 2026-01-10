import type { databases } from '~/drizzle'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { listDatabasesQuery } from '../sql/list-databases'

const databaseSystemNames = {
  [DatabaseType.Postgres]: 'postgres',
  [DatabaseType.MySQL]: 'mysql',
  [DatabaseType.MSSQL]: 'master',
  [DatabaseType.ClickHouse]: 'default',
} satisfies Record<DatabaseType, string>

export function useServerDatabases(database: typeof databases.$inferSelect) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: databasesList = [], isLoading } = useQuery({
    queryKey: ['server-databases', database.id],
    throwOnError: false,
    retry: 5,
    queryFn: async () => {
      const url = new SafeURL(database.connectionString)
      url.pathname = databaseSystemNames[database.type]

      const systemDatabase = {
        ...database,
        connectionString: url.toString(),
      }

      const dbNames = await listDatabasesQuery(systemDatabase)
      const currentDbName = new SafeURL(database.connectionString).pathname.replace(/^\//, '')
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
