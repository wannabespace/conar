import { unsupported } from '@tamery/shared/utils/unsupported'
import type { Kysely, RawBuilder } from 'kysely'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { RoutineKind } from './routine-kind'
import { routineKeyword } from './routine-kind'
import type { FunctionShape } from './shape'
import { createFunctionStatements } from './shape'

const swapInTransaction =
  (statements: {
    create: RawBuilder<unknown>
    drop: RawBuilder<unknown> | undefined
  }) =>
  // oxlint-disable-next-line ts/no-explicit-any
  (db: Kysely<any>) =>
    db.transaction().execute(async (tx) => {
      await statements.drop?.execute(tx)
      await statements.create.execute(tx)
    })

export const recreateFunctionQuery = ({
  identity,
  kind,
  name,
  replacesObject,
  schema,
  shape,
}: {
  identity: string | undefined
  kind: RoutineKind
  name: string
  // A signature the engine cannot replace in place. Dropping loses the
  // routine's grants and owner, so it only happens when it has to.
  replacesObject: boolean
  schema: string
  shape: FunctionShape
}) => {
  const create = createFunctionStatements({ replace: true, schema, shape })
  const dropByName = sql`DROP ${routineKeyword(kind)} ${sql.id(schema, name)}`

  return createQuery({
    query: {
      clickhouse: unsupported('Functions'),
      mssql: swapInTransaction({
        create: create.mssql,
        drop: replacesObject ? dropByName : undefined,
      }),
      mysql: swapInTransaction({ create: create.mysql, drop: dropByName }),
      postgres: swapInTransaction({
        create: create.postgres,
        // identity is pg_get_function_identity_arguments output, the form DROP expects
        drop: replacesObject
          ? sql`${dropByName}(${sql.raw(identity ?? '')})`
          : undefined,
      }),
    },
  })
}
