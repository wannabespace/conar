import type { ActiveFilter } from '@conar/shared/filters'
import type { databases } from '~/drizzle'
import { runSql } from '../query'
import { buildWhere } from './rows'

export function setSql(database: typeof databases.$inferSelect, {
  schema,
  table,
  values,
  filters,
}: { schema: string, table: string, values: Record<string, unknown>, filters: ActiveFilter[] }) {
  return runSql({
    database,
    label: `Set ${schema}.${table}`,
    query: {
      postgres: db => db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .updateTable(table)
        .set(values)
        .where(eb => buildWhere(eb, filters))
        .returning(Object.keys(values))
        .compile(),
      mysql: db => db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .updateTable(table)
        .set(values)
        .where(eb => buildWhere(eb, filters))
        .returning(Object.keys(values))
        .compile(),
    },
  })
}
