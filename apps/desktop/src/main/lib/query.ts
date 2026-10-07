import type { QueryExecutor } from '@tamery/connection/queries'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'

const lazyQueryExecutor = (
  load: () => Promise<{ query: QueryExecutor }>
): QueryExecutor => {
  const loadQuery = async () => {
    const dialect = await load()

    return dialect.query
  }

  return {
    beginTransaction: async (args) => {
      const query = await loadQuery()

      return query.beginTransaction(args)
    },
    cancel: async (args) => {
      const query = await loadQuery()

      return query.cancel(args)
    },
    commitTransaction: async (args) => {
      const query = await loadQuery()

      return query.commitTransaction(args)
    },
    execute: async (args) => {
      const query = await loadQuery()

      return query.execute(args)
    },
    executeTransaction: async (args) => {
      const query = await loadQuery()

      return query.executeTransaction(args)
    },
    rollbackTransaction: async (args) => {
      const query = await loadQuery()

      return query.rollbackTransaction(args)
    },
  }
}

export const queryExecutors = {
  clickhouse: lazyQueryExecutor(
    () => import('@tamery/connection/queries/dialects/clickhouse')
  ),
  mssql: lazyQueryExecutor(
    () => import('@tamery/connection/queries/dialects/mssql')
  ),
  mysql: lazyQueryExecutor(
    () => import('@tamery/connection/queries/dialects/mysql')
  ),
  postgres: lazyQueryExecutor(
    () => import('@tamery/connection/queries/dialects/pg')
  ),
} satisfies Record<ConnectionType, QueryExecutor>
