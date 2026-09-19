import { unsupported } from '@tamery/shared/utils/unsupported'
import type { RawBuilder } from 'kysely'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { literals } from '../shared/sql-fragments'
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
          const replacedName = `${name}${RECREATE_SUFFIX}`
          const target = sql.id(schema, newName)
          const statements = [
            sql`ALTER TYPE ${sql.id(schema, name)} RENAME TO ${sql.id(replacedName)}`,
            sql`CREATE TYPE ${target} AS ENUM (${literals(values)})`,
            ...dependents.flatMap((dependent) => {
              const restored = restoredDefault({ dependent, renames, target })

              return [
                restored &&
                  sql`ALTER TABLE ${sql.id(dependent.schema, dependent.table)} ALTER COLUMN ${sql.id(dependent.column)} DROP DEFAULT`,
                migrateColumn({ dependent, renames, target }),
                restored,
              ]
            }),
            sql`DROP TYPE ${sql.id(schema, replacedName)}`,
          ]

          for (const statement of statements) {
            // oxlint-disable-next-line no-await-in-loop
            await statement?.execute(tx)
          }
        }),
    },
  })
