import { type } from 'arktype'
import type { Kysely, RawBuilder } from 'kysely'
import { sql } from 'kysely'

import { mssqlQualified } from './sql-fragments'

export const definitionType = type({ definition: 'string | null' }).pipe(
  ({ definition }) => definition ?? ''
)

export const readDefinition =
  (expression: RawBuilder<unknown>) =>
  // oxlint-disable-next-line ts/no-explicit-any
  async (db: Kysely<any>) => {
    const { rows } = await sql<{
      definition: string | null
    }>`SELECT ${expression} AS definition`.execute(db)

    return { definition: rows[0]?.definition ?? null }
  }

// The catalog hands back the whole CREATE, so a module's body is what follows
// the AS that closes the header — which may sit on a line of its own. No match
// means the body cannot be read back, and the caller opens the object
// read-only rather than saving a mangled one.
export const mssqlModuleBody = (definition: RawBuilder<unknown>) => {
  const separator = sql.raw(
    "'%[' + CHAR(9) + CHAR(10) + CHAR(13) + ' ]AS[' + CHAR(9) + CHAR(10) + CHAR(13) + ' ]%'"
  )

  return sql<string>`CASE WHEN PATINDEX(${separator}, ${definition}) > 0 THEN SUBSTRING(${definition}, PATINDEX(${separator}, ${definition}) + 4, LEN(${definition})) END`
}

export const mssqlObjectDefinition = (schema: string, name: string) =>
  sql`OBJECT_DEFINITION(OBJECT_ID(${sql.lit(mssqlQualified(schema, name))}))`
