import { unsupported } from '@tamery/shared/utils/unsupported'
import type { RawBuilder } from 'kysely'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { literals } from '../shared/sql-fragments'
import type { EnumDependent } from './dependents'

const RECREATE_SUFFIX = '_tamery_replaced'

const DEFAULT_LITERAL = /^'(?<value>(?:[^']|'')*)'::/u

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

const migrate = ({
  dependent,
  renames,
  target,
}: {
  dependent: EnumDependent
  renames: Record<string, string>
  target: RawBuilder<unknown>
}) => {
  const table = sql.id(dependent.schema, dependent.table)
  const column = sql.id(dependent.column)
  const columnType = dependent.isArray ? sql`${target}[]` : target
  const cast = dependent.isArray
    ? sql`ARRAY(SELECT ${remapped(sql`value`, renames)}::${target} FROM unnest(${column}::text[]) AS value)`
    : sql`${remapped(sql`${column}::text`, renames)}::${target}`

  const altered = sql`ALTER TABLE ${table} ALTER COLUMN ${column} TYPE ${columnType} USING ${cast}`
  const literal = dependent.default?.match(DEFAULT_LITERAL)?.groups?.value

  if (literal === undefined) {
    return [altered]
  }

  const unescaped = literal.replaceAll("''", "'")
  const value = dependent.isArray
    ? unescaped
    : (renames[unescaped] ?? unescaped)

  return [
    sql`ALTER TABLE ${table} ALTER COLUMN ${column} DROP DEFAULT`,
    altered,
    sql`ALTER TABLE ${table} ALTER COLUMN ${column} SET DEFAULT ${sql.lit(value)}::${columnType}`,
  ]
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
            ...dependents.flatMap((dependent) =>
              migrate({ dependent, renames, target })
            ),
            sql`DROP TYPE ${sql.id(schema, replacedName)}`,
          ]

          for (const statement of statements) {
            // oxlint-disable-next-line no-await-in-loop
            await statement.execute(tx)
          }
        }),
    },
  })
