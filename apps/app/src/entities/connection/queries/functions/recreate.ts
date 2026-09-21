import { unsupported } from '@tamery/shared/utils/unsupported'
import type { Kysely, RawBuilder } from 'kysely'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { RoutineKind } from './routine-kind'
import { routineKeyword } from './routine-kind'

export const recreateFunctionQuery = ({
  create,
  identity,
  kind,
  name,
  schema,
}: {
  create: string
  identity: string | undefined
  kind: RoutineKind
  name: string
  schema: string
}) => {
  const dropByName = sql`DROP ${routineKeyword(kind)} ${sql.id(schema, name)}`
  const swapInTransaction =
    (drop: RawBuilder<unknown>) =>
    // oxlint-disable-next-line ts/no-explicit-any
    (db: Kysely<any>) =>
      db.transaction().execute(async (tx) => {
        await drop.execute(tx)
        await sql.raw(create).execute(tx)
      })

  return createQuery({
    query: {
      clickhouse: unsupported('Functions'),
      mssql: swapInTransaction(dropByName),
      mysql: swapInTransaction(dropByName),
      // identity is pg_get_function_identity_arguments output, the form DROP expects
      postgres: swapInTransaction(
        sql`${dropByName}(${sql.raw(identity ?? '')})`
      ),
    },
  })
}
