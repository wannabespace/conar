import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'

export const tablesAndSchemasType = type({
  schema: 'string',
  table: 'string',
})

export const tablesAndSchemasQuery = createQuery({
  type: tablesAndSchemasType.array(),
  query: () => ({
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
      .execute(),
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
      .execute(),
    clickhouse: db => db
      .selectFrom('information_schema.tables')
      .select([
        'table_schema as schema',
        'table_name as table',
      ])
      .where(({ eb, and }) => and([
        eb('table_schema', 'not in', ['INFORMATION_SCHEMA', 'information_schema', 'system']),
        eb('table_type', '=', 'BASE TABLE'),
      ]))
      .execute(),
    sqlite: async (db) => {
      const query = await db
        .selectFrom('sqlite_master' as any) // eslint-disable-line ts/no-explicit-any
        .select([
          sql<string>`'main'`.as('schema'),
          'name as table',
        ])
        .where('type', '=', 'table')
        .where('name', 'not like', 'sqlite_%')
        .execute()

      return query as { schema: string, table: string }[]
    },
  }),
})
