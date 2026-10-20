import { unsupported } from '@tamery/shared/unsupported'

import { plsqlUnit } from '~/core/queries/shared/plsql'
import { createQuery } from '~/core/runtime/query'

import type { TriggerShape, TriggerTarget } from './shape'
import { createTriggerStatements, dropTriggerStatements } from './shape'

export const createTriggerQuery = (
  params: TriggerTarget & { shape: TriggerShape }
) => {
  const create = createTriggerStatements(params)

  return createQuery({
    query: {
      clickhouse: unsupported('Triggers'),
      mssql: (db) => create.mssql.execute(db),
      mysql: (db) => create.mysql.execute(db),
      oracle: async (db) => {
        await create.oracle.execute(db)
        const errors = await plsqlUnit.errors(db, {
          name: params.shape.name,
          schema: params.schema,
          type: 'TRIGGER',
        })

        if (errors) {
          // An invalid trigger fails every write to its table.
          await dropTriggerStatements({
            ...params,
            name: params.shape.name,
          }).oracle.execute(db)
          throw new Error(errors)
        }
      },
      postgres: (db) => create.postgres.execute(db),
      sqlite: (db) => create.sqlite.execute(db),
    },
  })
}
