import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'

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
  createQuery({
    query: {
      clickhouse: unsupported('Row level security'),
      mssql: unsupported('Row level security'),
      mysql: unsupported('Row level security'),
      postgres: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} ${enabled ? sql`ENABLE` : sql`DISABLE`} ROW LEVEL SECURITY`.execute(
          db
        ),
    },
  })
