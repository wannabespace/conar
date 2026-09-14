import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { unsupported } from '../shared/unsupported'
import type { RoutineKind } from './routine-kind'
import { routineKeyword } from './routine-kind'

export const dropFunctionIfExistsQuery = ({
  kind,
  name,
  schema,
}: {
  kind: RoutineKind
  name: string
  schema: string
}) => {
  const drop = sql`DROP ${routineKeyword(kind)} IF EXISTS ${sql.id(schema, name)}`

  return createQuery({
    query: {
      clickhouse: unsupported('Functions'),
      mssql: (db) => drop.execute(db),
      mysql: (db) => drop.execute(db),
      postgres: unsupported('Replacing functions by drop'),
    },
  })
}
