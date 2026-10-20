import { unsupported } from '@tamery/shared/unsupported'

import { plsqlUnit } from '~/core/queries/shared/plsql'
import { createQuery } from '~/core/runtime/query'

import type { FunctionShape } from './shape'
import {
  createFunctionStatements,
  dropRoutineStatements,
  routineType,
} from './shape'

export const createFunctionQuery = ({
  schema,
  shape,
}: {
  schema: string
  shape: FunctionShape
}) => {
  const create = createFunctionStatements({ replace: false, schema, shape })

  return createQuery({
    query: {
      clickhouse: unsupported('Functions'),
      mssql: (db) => create.mssql.execute(db),
      mysql: (db) => create.mysql.execute(db),
      oracle: async (db) => {
        await create.oracle.execute(db)
        const errors = await plsqlUnit.errors(db, {
          name: shape.name,
          schema,
          type: routineType(shape.kind),
        })

        if (errors) {
          // Left in place, the broken routine would make the next save fail as a duplicate name.
          await dropRoutineStatements({
            identity: undefined,
            kind: shape.kind,
            name: shape.name,
            schema,
          }).oracle.execute(db)
          throw new Error(errors)
        }
      },
      postgres: (db) => create.postgres.execute(db),
      sqlite: unsupported('Functions'),
    },
  })
}
