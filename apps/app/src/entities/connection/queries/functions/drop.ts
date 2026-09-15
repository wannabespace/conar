import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { unsupported } from '../shared/unsupported'
import type { RoutineKind } from './routine-kind'
import { routineKeyword } from './routine-kind'

export const dropFunctionQuery = ({
  cascade,
  identity,
  kind,
  name,
  schema,
}: {
  cascade: boolean
  identity: string | undefined
  kind: RoutineKind
  name: string
  schema: string
}) => {
  const dropByName = sql`DROP ${routineKeyword(kind)} ${sql.id(schema, name)}`

  return createQuery({
    query: {
      clickhouse: unsupported('Functions'),
      mssql: (db) => dropByName.execute(db),
      mysql: (db) => dropByName.execute(db),
      // identity is pg_get_function_identity_arguments output, the form DROP expects
      postgres: (db) =>
        sql`${dropByName}(${sql.raw(identity ?? '')})${cascade ? sql` CASCADE` : sql``}`.execute(
          db
        ),
    },
  })
}
