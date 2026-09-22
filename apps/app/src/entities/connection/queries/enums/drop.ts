import { sql } from 'kysely'

import { statementQuery } from '../shared/statements'

export const dropEnumQuery = ({
  cascade,
  name,
  schema,
}: {
  cascade: boolean
  name: string
  schema: string
}) =>
  statementQuery('Editing enums', {
    postgres: sql`DROP TYPE ${sql.id(schema, name)}${cascade ? sql` CASCADE` : sql``}`,
  })
