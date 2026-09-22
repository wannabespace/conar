import { sql } from 'kysely'

import { statementQuery } from '../shared/statements'
import type { RoutineTarget } from './shape'
import { dropRoutineStatements } from './shape'

export const dropFunctionQuery = ({
  cascade,
  ...target
}: RoutineTarget & { cascade: boolean }) => {
  const drop = dropRoutineStatements(target)

  return statementQuery('Functions', {
    mssql: drop.byName,
    mysql: drop.byName,
    postgres: cascade ? sql`${drop.postgres} CASCADE` : drop.postgres,
  })
}
