import { unsupported } from '@tamery/shared/unsupported'
import type { RawBuilder } from 'kysely'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { EnumDependent } from './dependents'

const DEFAULT_LITERAL = /^'(?<value>(?:[^']|'')*)'::/u

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
          const target = sql.id(schema, newName)
          const replacedName = `${name}_tamery_replaced`

          const remapped = (expression: RawBuilder<unknown>) => {
            const cases = Object.entries(renames).map(
              ([from, to]) => sql` WHEN ${sql.lit(from)} THEN ${sql.lit(to)}`
            )

            return cases.length === 0
              ? expression
              : sql`CASE ${expression}${sql.join(cases, sql``)} ELSE ${expression} END`
          }

          // A DEFAULT expression cannot hold a subquery, so an array default is
          // remapped by the server before it goes back into SET DEFAULT.
          const remappedArray = async (literal: string) => {
            const { rows } = await sql<{ value: string }>`
              SELECT ARRAY(SELECT ${remapped(sql`value`)} FROM unnest(${sql.lit(literal)}::text[]) AS value)::text AS value
            `.execute(tx)

            return rows[0]?.value ?? literal
          }

          const migrate = async (dependent: EnumDependent) => {
            const table = sql.id(dependent.schema, dependent.table)
            const column = sql.id(dependent.column)
            const columnType = dependent.isArray ? sql`${target}[]` : target
            const cast = dependent.isArray
              ? sql`ARRAY(SELECT ${remapped(sql`value`)}::${target} FROM unnest(${column}::text[]) AS value)`
              : sql`${remapped(sql`${column}::text`)}::${target}`
            const altered = sql`ALTER TABLE ${table} ALTER COLUMN ${column} TYPE ${columnType} USING ${cast}`
            const literal =
              dependent.default?.match(DEFAULT_LITERAL)?.groups?.value

            if (literal === undefined) {
              return [altered]
            }

            const unescaped = literal.replaceAll("''", "'")
            const value = dependent.isArray
              ? await remappedArray(unescaped)
              : (renames[unescaped] ?? unescaped)

            return [
              sql`ALTER TABLE ${table} ALTER COLUMN ${column} DROP DEFAULT`,
              altered,
              sql`ALTER TABLE ${table} ALTER COLUMN ${column} SET DEFAULT ${sql.lit(value)}::${columnType}`,
            ]
          }

          const migrations = await Promise.all(dependents.map(migrate))

          await sql`ALTER TYPE ${sql.id(schema, name)} RENAME TO ${sql.id(replacedName)}`.execute(
            tx
          )
          await tx
            .withSchema(schema)
            .schema.createType(newName)
            .asEnum(values)
            .execute()

          for (const statement of migrations.flat()) {
            // oxlint-disable-next-line no-await-in-loop
            await statement.execute(tx)
          }

          await tx.withSchema(schema).schema.dropType(replacedName).execute()
        }),
    },
  })
