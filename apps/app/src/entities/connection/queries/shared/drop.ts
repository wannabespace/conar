import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { unsupported } from '@tamery/shared/utils/unsupported'
import type { Kysely, RawBuilder } from 'kysely'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'

export type DropStatements = Partial<
  Record<ConnectionType, RawBuilder<unknown>>
>

const queryOf = (
  drop: DropStatements,
  feature: string,
  execute: (
    statement: RawBuilder<unknown>
    // oxlint-disable-next-line ts/no-explicit-any
  ) => (db: Kysely<any>) => Promise<unknown>
) => {
  const of = (statement: RawBuilder<unknown> | undefined) =>
    statement ? execute(statement) : unsupported(feature)

  return createQuery({
    query: {
      clickhouse: of(drop.clickhouse),
      mssql: of(drop.mssql),
      mysql: of(drop.mysql),
      postgres: of(drop.postgres),
    },
  })
}

export const dropStatementsQuery = (drop: DropStatements, feature: string) =>
  queryOf(drop, feature, (statement) => (db) => statement.execute(db))

export const recreateDefinitionQuery = ({
  create,
  drop,
  feature,
}: {
  create: string
  drop: DropStatements
  feature: string
}) =>
  queryOf(
    drop,
    feature,
    (statement) => (db) =>
      db.transaction().execute(async (tx) => {
        await statement.execute(tx)
        await sql.raw(create).execute(tx)
      })
  )
