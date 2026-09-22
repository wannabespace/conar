import { sql } from 'kysely'

import { statementQuery } from '../shared/statements'

// A policy only decides anything once its table enforces row level security.
export const setRowLevelSecurityQuery = ({
  enabled,
  schema,
  table,
}: {
  enabled: boolean
  schema: string
  table: string
}) =>
  statementQuery('Row level security', {
    postgres: sql`ALTER TABLE ${sql.id(schema, table)} ${sql.raw(enabled ? 'ENABLE' : 'DISABLE')} ROW LEVEL SECURITY`,
  })
