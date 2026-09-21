import { unsupported } from '@tamery/shared/utils/unsupported'
import type { Kysely, RawBuilder } from 'kysely'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'

export type DropStatements = Record<
  'mssql' | 'mysql' | 'postgres',
  RawBuilder<unknown>
>

export const dropStatementsQuery = (drop: DropStatements, feature: string) =>
  createQuery({
    query: {
      clickhouse: unsupported(feature),
      mssql: (db) => drop.mssql.execute(db),
      mysql: (db) => drop.mysql.execute(db),
      postgres: (db) => drop.postgres.execute(db),
    },
  })

export const recreateDefinitionQuery = ({
  create,
  drop,
  feature,
}: {
  create: string
  drop: DropStatements
  feature: string
}) => {
  const swap =
    (statement: RawBuilder<unknown>) =>
    // oxlint-disable-next-line ts/no-explicit-any
    (db: Kysely<any>) =>
      db.transaction().execute(async (tx) => {
        await statement.execute(tx)
        await sql.raw(create).execute(tx)
      })

  return createQuery({
    query: {
      clickhouse: unsupported(feature),
      mssql: swap(drop.mssql),
      mysql: swap(drop.mysql),
      postgres: swap(drop.postgres),
    },
  })
}
