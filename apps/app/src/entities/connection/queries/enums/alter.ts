import { sql } from 'kysely'

import { statementQuery } from '../shared/statements'

export const alterEnumQuery = ({
  additions,
  name,
  newName,
  renames,
  schema,
}: {
  additions: string[]
  name: string
  newName: string
  renames: Record<string, string>
  schema: string
}) => {
  const target = sql.id(schema, name)

  return statementQuery('Editing enums', {
    postgres: [
      ...Object.entries(renames).map(
        ([value, renamed]) =>
          sql`ALTER TYPE ${target} RENAME VALUE ${sql.lit(value)} TO ${sql.lit(renamed)}`
      ),
      ...additions.map(
        (value) => sql`ALTER TYPE ${target} ADD VALUE ${sql.lit(value)}`
      ),
      newName === name
        ? undefined
        : sql`ALTER TYPE ${target} RENAME TO ${sql.id(newName)}`,
    ],
  })
}
