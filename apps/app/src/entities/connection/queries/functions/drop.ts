import { sql } from 'kysely'

import type { DropStatements } from '../shared/drop'
import { dropStatementsQuery } from '../shared/drop'
import type { RoutineKind } from './routine-kind'
import { routineKeyword } from './routine-kind'

export const dropFunctionStatements = ({
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
}): DropStatements => {
  const dropByName = sql`DROP ${routineKeyword(kind)} ${sql.id(schema, name)}`

  return {
    mssql: dropByName,
    mysql: dropByName,
    // identity is pg_get_function_identity_arguments output, the form DROP expects
    postgres: sql`${dropByName}(${sql.raw(identity ?? '')})${cascade ? sql` CASCADE` : sql``}`,
  }
}

export const dropFunctionQuery = (
  params: Parameters<typeof dropFunctionStatements>[0]
) => dropStatementsQuery(dropFunctionStatements(params), 'Functions')
