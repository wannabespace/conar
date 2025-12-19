import type { databases } from '~/drizzle'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { useState } from 'react'
import { listDatabasesQuery } from '../sql/list-databases'

export function useServerDatabases(database: typeof databases.$inferSelect) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [databasesList, setDatabasesList] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const toggleExpand = async () => {
    if (isExpanded) {
      setIsExpanded(false)
      return
    }

    setIsExpanded(true)

    if (databasesList.length === 0) {
      setIsLoading(true)
      const url = new SafeURL(database.connectionString)

      switch (database.type) {
        case DatabaseType.Postgres:
          url.pathname = 'postgres'
          break
        case DatabaseType.MySQL:
          url.pathname = 'mysql'
          break
        case DatabaseType.MSSQL:
          url.pathname = 'master'
          break
        case DatabaseType.ClickHouse:
          url.pathname = 'default'
          break
      }

      const systemDatabase = {
        ...database,
        connectionString: url.toString(),
      }

      try {
        const dbNames = await listDatabasesQuery.run(systemDatabase)
        const currentDbName = new SafeURL(database.connectionString).pathname.replace(/^\//, '')
        const otherDbs = dbNames.filter(name => name !== currentDbName)
        setDatabasesList(otherDbs)
      }
      catch (err) {
        console.error('Failed to list databases', err)
      }
      finally {
        setIsLoading(false)
      }
    }
  }

  return {
    isExpanded,
    isLoading,
    databasesList,
    toggleExpand,
    setIsExpanded,
  }
}
