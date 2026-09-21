import { unsupported } from '@tamery/shared/utils/unsupported'
import type { Kysely, RawBuilder } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { TriggerShape, TriggerTarget } from './shape'
import { createTriggerStatements, dropTriggerStatements } from './shape'

const swapInTransaction =
  (statements: { create: RawBuilder<unknown>; drop: RawBuilder<unknown> }) =>
  // oxlint-disable-next-line ts/no-explicit-any
  (db: Kysely<any>) =>
    db.transaction().execute(async (tx) => {
      await statements.drop.execute(tx)
      await statements.create.execute(tx)
    })

export const recreateTriggerQuery = ({
  name,
  schema,
  shape,
  table,
}: TriggerTarget & { name: string; shape: TriggerShape }) => {
  const drop = dropTriggerStatements({ name, schema, table })
  const create = createTriggerStatements({ schema, shape, table })

  return createQuery({
    query: {
      clickhouse: unsupported('Triggers'),
      mssql: swapInTransaction({ create: create.mssql, drop: drop.mssql }),
      mysql: swapInTransaction({ create: create.mysql, drop: drop.mysql }),
      postgres: swapInTransaction({
        create: create.postgres,
        drop: drop.postgres,
      }),
    },
  })
}
