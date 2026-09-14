import type { RawBuilder } from 'kysely'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { literals } from '../shared/sql-fragments'
import { unsupported } from '../shared/unsupported'
import type { EnumDependent } from './dependents'

const RECREATE_SUFFIX = '_tamery_replaced'

const DEFAULT_LITERAL = /^'(?<value>(?:[^']|'')*)'::/u

// Rows still hold the old labels, so a renamed value is rewritten as it casts.
const remapped = (
  expression: RawBuilder<unknown>,
  renames: Record<string, string>
) => {
  const entries = Object.entries(renames)

  if (entries.length === 0) {
    return expression
  }

  return sql`CASE ${expression}${sql.join(
    entries.map(
      ([from, to]) => sql` WHEN ${sql.lit(from)} THEN ${sql.lit(to)}`
    ),
    sql``
  )} ELSE ${expression} END`
}

const columnType = (dependent: EnumDependent, target: RawBuilder<unknown>) =>
  dependent.isArray ? sql`${target}[]` : target

const migrateColumn = ({
  dependent,
  renames,
  target,
}: {
  dependent: EnumDependent
  renames: Record<string, string>
  target: RawBuilder<unknown>
}) => {
  const column = sql.id(dependent.column)
  const using = dependent.isArray
    ? sql`ARRAY(SELECT ${remapped(sql`value`, renames)}::${target} FROM unnest(${column}::text[]) AS value)`
    : sql`${remapped(sql`${column}::text`, renames)}::${target}`

  return sql`ALTER TABLE ${sql.id(dependent.schema, dependent.table)} ALTER COLUMN ${column} TYPE ${columnType(dependent, target)} USING ${using}`
}

// A default is stored as `'label'::schema.type`, so it is re-applied against the
// new type carrying any rename. An array literal is only re-cast, so a renamed
// label inside one still fails the cast and rolls the change back.
const restoredDefault = ({
  dependent,
  renames,
  target,
}: {
  dependent: EnumDependent
  renames: Record<string, string>
  target: RawBuilder<unknown>
}) => {
  const literal = dependent.default?.match(DEFAULT_LITERAL)?.groups?.value

  if (literal === undefined) {
    return null
  }

  const unescaped = literal.replaceAll("''", "'")
  const value = dependent.isArray
    ? unescaped
    : (renames[unescaped] ?? unescaped)

  return sql`ALTER TABLE ${sql.id(dependent.schema, dependent.table)} ALTER COLUMN ${sql.id(dependent.column)} SET DEFAULT ${sql.lit(value)}::${columnType(dependent, target)}`
}

// PostgreSQL cannot remove or reorder the values of a live enum, so the type is
// replaced and every dependent column moved onto it.
export const recreateEnumQuery = ({
  dependents,
  name,
  newName,
  renames,
  schema,
  values,
}: {
  dependents: EnumDependent[]
  name: string
  newName: string
  renames: Record<string, string>
  schema: string
  values: string[]
}) =>
  createQuery({
    query: {
      clickhouse: unsupported('Editing enums'),
      mssql: unsupported('Enums'),
      mysql: unsupported('Editing enums'),
      postgres: (db) =>
        db.transaction().execute(async (tx) => {
          const replaced = sql.id(schema, `${name}${RECREATE_SUFFIX}`)
          const target = sql.id(schema, newName)

          await sql`ALTER TYPE ${sql.id(schema, name)} RENAME TO ${sql.id(`${name}${RECREATE_SUFFIX}`)}`.execute(
            tx
          )
          await sql`CREATE TYPE ${target} AS ENUM (${literals(values)})`.execute(
            tx
          )

          for (const dependent of dependents) {
            if (dependent.default !== null) {
              // oxlint-disable-next-line no-await-in-loop -- one column at a time, in order
              await sql`ALTER TABLE ${sql.id(dependent.schema, dependent.table)} ALTER COLUMN ${sql.id(dependent.column)} DROP DEFAULT`.execute(
                tx
              )
            }

            // oxlint-disable-next-line no-await-in-loop -- one column at a time, in order
            await migrateColumn({ dependent, renames, target }).execute(tx)

            const restored = restoredDefault({ dependent, renames, target })

            if (restored) {
              // oxlint-disable-next-line no-await-in-loop -- one column at a time, in order
              await restored.execute(tx)
            }
          }

          await sql`DROP TYPE ${replaced}`.execute(tx)
        }),
    },
  })
