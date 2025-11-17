import type { databases } from '~/drizzle'
import { type } from 'arktype'
import { runSql } from '../query'

export const tablesAndSchemasType = type({
  schema: 'string',
  table: 'string',
})

export function tablesAndSchemasSql(database: typeof databases.$inferSelect) {
  return runSql({
    database,
    label: 'Tables and Schemas',
    validate: tablesAndSchemasType.assert,
    query: {
      postgres: db => db
        .selectFrom('information_schema.tables')
        .select([
          'table_schema as schema',
          'table_name as table',
        ])
        .where(({ eb, and, not }) => and([
          eb('table_schema', 'not in', ['pg_catalog', 'information_schema']),
          not(eb('table_schema', 'like', 'pg_toast%')),
          not(eb('table_schema', 'like', 'pg_temp%')),
          eb('table_type', '=', 'BASE TABLE'),
        ]))
        .$assertType<typeof tablesAndSchemasType.inferIn>()
        .compile(),
      mysql: db => db
        .selectFrom('information_schema.TABLES')
        .select([
          'TABLE_SCHEMA as schema',
          'TABLE_NAME as table',
        ])
        .where(({ eb, and }) => and([
          eb('TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys']),
          eb('TABLE_TYPE', '=', 'BASE TABLE'),
        ]))
        .$assertType<typeof tablesAndSchemasType.inferIn>()
        .compile(),
    },
  })
}
