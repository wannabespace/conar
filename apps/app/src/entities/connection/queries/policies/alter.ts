import { sql } from 'kysely'

import { statementQuery } from '../shared/statements'
import type { PolicyTarget } from './shape'
import { expression, policyOn, roleList } from './shape'

export const alterPolicyQuery = ({
  check,
  newName,
  roles,
  using,
  ...target
}: PolicyTarget & {
  check: string | null
  newName: string | null
  roles: string[] | null
  using: string | null
}) => {
  const policy = policyOn(target)

  return statementQuery('Row policies', {
    postgres: [
      sql`ALTER POLICY ${policy}${roles ? sql` TO ${roleList(roles)}` : sql``}${expression('USING', using)}${expression('WITH CHECK', check)}`,
      newName
        ? sql`ALTER POLICY ${policy} RENAME TO ${sql.id(newName)}`
        : undefined,
    ],
  })
}
