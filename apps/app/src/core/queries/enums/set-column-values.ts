import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { literals } from '~/core/queries/shared/sql-fragments'
import { createQuery } from '~/core/runtime/query'

export const setColumnEnumValuesQuery = ({
  charset,
  collation,
  column,
  comment,
  defaultValue,
  isSet,
  nullable,
  schema,
  table,
  values,
}: {
  charset: string | null
  collation: string | null
  column: string
  comment: string | undefined
  defaultValue: string | null
  isSet: boolean
  nullable: boolean
  schema: string
  table: string
  values: string[]
}) =>
  createQuery({
    query: {
      clickhouse: unsupported('Editing enums'),
      mssql: unsupported('Enums'),
      mysql: (db) =>
        db
          .withSchema(schema)
          .$extendTables<{ [table]: Record<string, unknown> }>()
          .schema.alterTable(table)
          .modifyColumn(
            column,
            sql`${sql.raw(isSet ? 'set' : 'enum')}(${literals(values)})`,
            (build) => {
              let definition = build
              if (charset) {
                definition = definition.modifyFront(
                  sql`character set ${sql.id(charset)}`
                )
              }
              if (collation) {
                definition = definition.modifyFront(
                  sql`collate ${sql.id(collation)}`
                )
              }
              if (defaultValue !== null) {
                definition = definition.defaultTo(sql.lit(defaultValue))
              }
              if (!nullable) {
                definition = definition.notNull()
              }
              if (comment) {
                definition = definition.modifyEnd(
                  sql`comment ${sql.lit(comment)}`
                )
              }
              return definition
            }
          )
          .execute(),
      postgres: unsupported('Column-bound enums'),
    },
  })
