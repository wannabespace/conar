import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { unsupported } from '../shared/unsupported'

// ADD VALUE is transactional from PostgreSQL 12 on, as long as the new label is
// not also used in the same transaction — never the case here.
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
}) =>
  createQuery({
    query: {
      clickhouse: unsupported('Editing enums'),
      mssql: unsupported('Enums'),
      mysql: unsupported('Editing enums'),
      postgres: (db) =>
        db.transaction().execute(async (tx) => {
          const target = sql.id(schema, name)

          for (const [value, newValue] of Object.entries(renames)) {
            // oxlint-disable-next-line no-await-in-loop
            await sql`ALTER TYPE ${target} RENAME VALUE ${sql.lit(value)} TO ${sql.lit(newValue)}`.execute(
              tx
            )
          }
          for (const value of additions) {
            // oxlint-disable-next-line no-await-in-loop
            await sql`ALTER TYPE ${target} ADD VALUE ${sql.lit(value)}`.execute(
              tx
            )
          }
          if (newName !== name) {
            await sql`ALTER TYPE ${target} RENAME TO ${sql.id(newName)}`.execute(
              tx
            )
          }
        }),
    },
  })
