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

// Oracle commits each DDL statement, so only the object's saved DDL brings it back when its replacement fails.
export const replaceWithSavedDdl = async (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  {
    create,
    drop,
    savedDdl,
  }: {
    create: () => Promise<unknown>
    drop: () => Promise<unknown>
    savedDdl: RawBuilder<string | null>
  }
) => {
  const { definition } = await readDefinition(savedDdl)(db)

  if (!definition) {
    throw new Error(
      'Cannot read the saved DDL, so a failed save could not restore it.'
    )
  }
  await drop()
  try {
    await create()
  } catch (error) {
    await sql.raw(definition).execute(db)
    throw error
  }
}

const headerEnd = /(?<preceding>\S+)\s+AS\s/giu
const parameterName = /@\w+$/u

// Null means the body cannot be read back; the caller opens it read-only.
export const mssqlModuleParts = (definition: string | null) => {
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
    const end = match.index + matched.length

    return { body: definition.slice(end), header: definition.slice(0, end) }
  }

  return null
}

export const mssqlModuleBody = (definition: string | null) =>
  mssqlModuleParts(definition)?.body ?? null

export const mssqlObjectDefinition = (schema: string, name: string) =>
  sql<
    string | null
  >`OBJECT_DEFINITION(OBJECT_ID(${sql.lit(mssqlQualified(schema, name))}))`
