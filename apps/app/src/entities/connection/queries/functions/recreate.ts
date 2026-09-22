import { unsupported } from '@tamery/shared/unsupported'

import { createQuery } from '../../runtime/query'
import type { FunctionShape, RoutineTarget } from './shape'
import { createFunctionStatements, dropRoutineStatements } from './shape'

// replacesObject marks a signature the engine cannot replace in place.
export const recreateFunctionQuery = ({
  replacesObject,
  shape,
  ...target
}: RoutineTarget & { replacesObject: boolean; shape: FunctionShape }) => {
  const create = createFunctionStatements({
    replace: true,
    schema: target.schema,
    shape,
  })
  const drop = dropRoutineStatements(target)

  return createQuery({
    query: {
      clickhouse: unsupported('Functions'),
      mssql: (db) =>
        db.transaction().execute(async (tx) => {
          if (replacesObject) {
            await drop.mssql.execute(tx)
          }
          await create.mssql.execute(tx)
        }),
      mysql: (db) =>
        db.transaction().execute(async (tx) => {
          await drop.mysql.execute(tx)
          await create.mysql.execute(tx)
        }),
      postgres: (db) =>
        db.transaction().execute(async (tx) => {
          if (replacesObject) {
            await drop.postgres.execute(tx)
          }
          await create.postgres.execute(tx)
        }),
    },
  })
}
