import { unsupported } from '@tamery/shared/utils/unsupported'

import { createQuery } from '../../runtime/query'
import type { TriggerShape, TriggerTarget } from './shape'
import {
  createTriggerStatements,
  dropTriggerStatements,
  setTriggerEnabledStatements,
} from './shape'

export const recreateTriggerQuery = ({
  enabled,
  mode,
  name,
  schema,
  shape,
  table,
}: TriggerTarget & {
  enabled: boolean | null
  mode: string
  name: string
  shape: TriggerShape
}) => {
  const drop = dropTriggerStatements({ name, schema, table })
  const create = createTriggerStatements({ schema, shape, table })
  // A created trigger fires on the origin; one that did not comes back as it was.
  const restore =
    enabled === false || mode !== 'O'
      ? setTriggerEnabledStatements({
          enabled: enabled !== false,
          mode,
          name: shape.name,
          schema,
          table,
        })
      : undefined

  return createQuery({
    query: {
      clickhouse: unsupported('Triggers'),
      mssql: (db) =>
        db.transaction().execute(async (tx) => {
          await drop.mssql.execute(tx)
          await create.mssql.execute(tx)
          await restore?.mssql.execute(tx)
        }),
      mysql: (db) =>
        db.transaction().execute(async (tx) => {
          await drop.mysql.execute(tx)
          await create.mysql.execute(tx)
        }),
      postgres: (db) =>
        db.transaction().execute(async (tx) => {
          await drop.postgres.execute(tx)
          await create.postgres.execute(tx)
          await restore?.postgres.execute(tx)
        }),
    },
  })
}
