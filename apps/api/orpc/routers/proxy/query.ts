import type { QueryExecutor } from '@conar/connection/queries'
import type { ConnectionType } from '@conar/shared/enums/connection-type'
import * as clickhouse from '@conar/connection/queries/dialects/clickhouse'
import * as mssql from '@conar/connection/queries/dialects/mssql'
import * as mysql from '@conar/connection/queries/dialects/mysql'
import * as pg from '@conar/connection/queries/dialects/pg'
import { type } from '@orpc/server'
import { orpc } from '~/orpc'

function createQueryExecutor(dialect: QueryExecutor) {
  return {
    execute: orpc.input(type<Parameters<typeof dialect.execute>[0]>()).handler(({ input }) => dialect.execute(input)),
    beginTransaction: orpc.input(type<Parameters<typeof dialect.beginTransaction>[0]>()).handler(({ input }) => dialect.beginTransaction(input)),
    executeTransaction: orpc.input(type<Parameters<typeof dialect.executeTransaction>[0]>()).handler(({ input }) => dialect.executeTransaction(input)),
    commitTransaction: orpc.input(type<Parameters<typeof dialect.commitTransaction>[0]>()).handler(({ input }) => dialect.commitTransaction(input)),
    rollbackTransaction: orpc.input(type<Parameters<typeof dialect.rollbackTransaction>[0]>()).handler(({ input }) => dialect.rollbackTransaction(input)),
  } satisfies Record<keyof QueryExecutor, unknown>
}

export const query = {
  postgres: createQueryExecutor(pg.query),
  mysql: createQueryExecutor(mysql.query),
  clickhouse: createQueryExecutor(clickhouse.query),
  mssql: createQueryExecutor(mssql.query),
} satisfies Record<ConnectionType, Record<keyof QueryExecutor, unknown>>
