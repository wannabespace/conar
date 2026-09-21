import { unsupported } from '@tamery/shared/utils/unsupported'
import type { Kysely, RawBuilder } from 'kysely'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'

export const recreateTriggerQuery = ({
  create,
  name,
  schema,
  table,
}: {
  create: string
  name: string
  schema: string
  table: string
}) => {
  const dropByName = sql`DROP TRIGGER ${sql.id(schema, name)}`
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
      clickhouse: unsupported('Triggers'),
      mssql: swapInTransaction(dropByName),
      mysql: swapInTransaction(dropByName),
      postgres: swapInTransaction(
        sql`DROP TRIGGER ${sql.id(name)} ON ${sql.id(schema, table)}`
      ),
    },
  })
}
