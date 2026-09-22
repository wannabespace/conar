import { type } from 'arktype'
import type { Kysely, RawBuilder } from 'kysely'
import { sql } from 'kysely'

import { mssqlQualified } from './sql-fragments'

export const definitionType = type({ definition: 'string | null' }).pipe(
  ({ definition }) => definition ?? ''
)

export const readDefinition =
  (expression: RawBuilder<string | null>) =>
  // oxlint-disable-next-line ts/no-explicit-any
  async (db: Kysely<any>) => {
    const row = await db
      .selectNoFrom(expression.as('definition'))
      .executeTakeFirst()

    return { definition: row?.definition ?? null }
  }

const headerEnd = /(?<preceding>\S+)\s+AS\s/giu
const parameterName = /@\w+$/u

// `EXECUTE AS caller` and a parameter's `@p AS int` read as the header's
// closing AS and are skipped; an AS inside a header comment still wins. Null
// means the body cannot be read back, and the caller opens it read-only.
export const mssqlModuleBody = (definition: string | null) => {
  if (!definition) {
    return null
  }

  for (const match of definition.matchAll(headerEnd)) {
    const [matched] = match
    const preceding = match.groups?.preceding ?? ''

    if (
      parameterName.test(preceding) ||
      preceding.toUpperCase() === 'EXECUTE'
    ) {
      continue
    }

    return definition.slice(match.index + matched.length)
  }

  return null
}

export const mssqlObjectDefinition = (schema: string, name: string) =>
  sql<
    string | null
  >`OBJECT_DEFINITION(OBJECT_ID(${sql.lit(mssqlQualified(schema, name))}))`
