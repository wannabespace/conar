import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { unsupported } from '@tamery/shared/utils/unsupported'
import type { Kysely, RawBuilder } from 'kysely'

import { createQuery } from '../../runtime/query'

type Statement = RawBuilder<unknown>

const run = (
  feature: string,
  statements: Statement | (Statement | undefined)[] | undefined
) => {
  if (!statements) {
    return unsupported(feature)
  }
  if (!Array.isArray(statements)) {
    // oxlint-disable-next-line ts/no-explicit-any -- runs on any dialect's instance
    return (db: Kysely<any>) => statements.execute(db)
  }

  // oxlint-disable-next-line ts/no-explicit-any -- runs on any dialect's instance
  return (db: Kysely<any>) =>
    db.transaction().execute(async (tx) => {
      for (const statement of statements) {
        // oxlint-disable-next-line no-await-in-loop -- the order is the point
        await statement?.execute(tx)
      }
    })
}

// The engines that speak one statement; ClickHouse writes none of this DDL.
export const sqlEngines = (statement: Statement) => ({
  mssql: statement,
  mysql: statement,
  postgres: statement,
})

// A dialect that cannot write the statement is left out and answers with
// `unsupported`. A list runs as one transaction: Postgres and SQL Server roll
// a failed step back, MySQL commits DDL as it goes and warns the user first.
export const statementQuery = (
  feature: string,
  statements: Partial<
    Record<ConnectionType, Statement | (Statement | undefined)[]>
  >
) =>
  createQuery({
    query: {
      clickhouse: run(feature, statements.clickhouse),
      mssql: run(feature, statements.mssql),
      mysql: run(feature, statements.mysql),
      postgres: run(feature, statements.postgres),
    },
  })
