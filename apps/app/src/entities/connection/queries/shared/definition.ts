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

export const mssqlObjectDefinition = (schema: string, name: string) =>
  sql`OBJECT_DEFINITION(OBJECT_ID(${sql.lit(mssqlQualified(schema, name))}))`
