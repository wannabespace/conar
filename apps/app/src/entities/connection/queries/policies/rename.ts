import { sql } from 'kysely'

import { statementQuery } from '../shared/statements'
import type { PolicyTarget } from './shape'
import { policyOn } from './shape'

export const renamePolicyQuery = ({
  newName,
  ...target
}: PolicyTarget & { newName: string }) =>
  statementQuery('Row policies', {
    postgres: sql`ALTER POLICY ${policyOn(target)} RENAME TO ${sql.id(newName)}`,
  })
