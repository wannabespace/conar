import { Dialect } from '@tamery/shared/enums/connection-type'
import { dialects, tokenize } from '@tamery/sql'
import type { Kysely, RawBuilder } from 'kysely'
import { sql } from 'kysely'

import type { Database as OracleDatabase } from '~/core/runtime/dialects/oracle/schema'

interface PlsqlUnit {
  name: string
  schema: string
  type: 'FUNCTION' | 'PROCEDURE' | 'TRIGGER'
}

// ALL_SOURCE keeps a unit from its kind keyword on; a routine's schema is blanked out, a trigger's kept.
export const plsqlHeader = (source: string) => {
  const tokens = tokenize(source, dialects[Dialect.Oracle]).tokens.filter(
    (token) => token.kind !== 'comment'
  )

  return { name: tokens[2]?.text === '.' ? 3 : 1, tokens }
}

// Replaying the bare text would land in the session's schema.
const qualify = (source: string, { name, schema, type }: PlsqlUnit) => {
  const header = plsqlHeader(source)
  const nameToken = header.tokens[header.name]

  return nameToken
    ? `CREATE OR REPLACE ${type} "${schema}"."${name}"${source.slice(nameToken.end)}`
    : null
}

const definition = async (db: Kysely<OracleDatabase>, unit: PlsqlUnit) => {
  const lines = await db
    .selectFrom('ALL_SOURCE')
    .select('TEXT as text')
    .where('OWNER', '=', unit.schema)
    .where('NAME', '=', unit.name)
    .where('TYPE', '=', unit.type)
    .orderBy('LINE')
    .execute()

  return qualify(lines.map((line) => line.text ?? '').join(''), unit)
}

const compileErrors = async (
  db: Kysely<OracleDatabase>,
  unit: PlsqlUnit,
  headerLines: number
) => {
  const errors = await db
    .selectFrom('ALL_ERRORS')
    .select(['LINE as line', 'TEXT as text'])
    .where('OWNER', '=', unit.schema)
    .where('NAME', '=', unit.name)
    .where('TYPE', '=', unit.type)
    .where('ATTRIBUTE', '=', 'ERROR')
    .orderBy('SEQUENCE')
    .execute()

  return (
    errors
      .map(({ line, text }) =>
        line > headerLines ? `Line ${line - headerLines}: ${text}` : text
      )
      .join('\n') || null
  )
}

const dropUnit = ({ name, schema, type }: PlsqlUnit) =>
  sql`DROP ${sql.raw(type)} ${sql.id(schema, name)}`

const lineCount = (text: string) => text.split('\n').length

export const plsqlUnit = {
  definition,
  // Oracle commits each DDL statement, and a unit that fails to compile is still created (INVALID),
  // even over the one CREATE OR REPLACE replaced; so only the original's saved source brings it back.
  save: async (
    db: Kysely<OracleDatabase>,
    {
      body,
      create,
      original,
      restored,
      unit,
    }: {
      /** The Body the form shows, which `create` ends with. */
      body: string
      create: (replace: boolean) => RawBuilder<unknown>
      /** The unit this save replaces, `null` for a new one. */
      original: PlsqlUnit | null
      /** Redoes what a replayed original's source does not carry (a trigger's DISABLE). */
      restored?: RawBuilder<unknown>
      unit: PlsqlUnit
    }
  ) => {
    const source = original && (await definition(db, original))

    if (original && !source) {
      throw new Error(
        `Cannot read the source of ${original.name}, so a failed save could not restore it.`
      )
    }
    const inPlace = original?.name === unit.name && original.type === unit.type
    const restore = async () => {
      if (source) {
        await sql.raw(source).execute(db)
        await restored?.execute(db)
      }
    }

    if (original && !inPlace) {
      await dropUnit(original).execute(db)
    }
    const statement = create(inPlace).compile(db)
    try {
      await db.executeQuery(statement)
    } catch (error) {
      if (!inPlace) {
        await restore()
      }
      throw error
    }
    // ALL_ERRORS counts a trigger's lines from its PL/SQL block, a routine's from its header.
    const headerLines =
      unit.type === 'TRIGGER' ? 0 : lineCount(statement.sql) - lineCount(body)
    const errors = await compileErrors(db, unit, headerLines)

    if (errors) {
      // Left in place, a broken unit makes the next save fail as a duplicate name, and an invalid trigger fails every write to its table.
      if (!inPlace) {
        await dropUnit(unit).execute(db)
      }
      await restore()
      throw new Error(errors)
    }
  },
}
