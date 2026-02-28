import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'

export const tablesAndSchemasType = type({
  schema: 'string',
  table: 'string',
})

export const tablesAndSchemasQuery = createQuery({
  type: tablesAndSchemasType.array(),
  query: ({ showSystem }: { showSystem: boolean }) => ({
    postgres: db => db
      .selectFrom('information_schema.tables')
      .select([
        'table_schema as schema',
        'table_name as table',
      ])
      .where(({ eb, and, not }) => and([
        not(eb('table_schema', 'like', 'pg_toast%')),
        not(eb('table_schema', 'like', 'pg_temp%')),
        eb('table_type', '=', 'BASE TABLE'),
      ]))
      .$if(!showSystem, qb => qb.where(({ eb, and }) => and([
        eb('table_schema', 'not in', ['pg_catalog', 'information_schema']),
      ])))
      .execute(),
    mysql: db => db
      .selectFrom('information_schema.TABLES')
      .select([
        'TABLE_SCHEMA as schema',
        'TABLE_NAME as table',
      ])
      .where('TABLE_TYPE', '=', 'BASE TABLE')
      .$if(!showSystem, qb => qb.where(eb => eb('TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])))
      .execute(),
    mssql: db => db
      .selectFrom('information_schema.TABLES')
      .select([
        'TABLE_SCHEMA as schema',
        'TABLE_NAME as table',
      ])
      .where('TABLE_TYPE', '=', 'BASE TABLE')
      .execute(),
    clickhouse: db => db
      .selectFrom('information_schema.tables')
      .select([
        'table_schema as schema',
        'table_name as table',
      ])
      .where('table_type', '=', 'BASE TABLE')
      .$if(!showSystem, qb => qb.where(eb => eb('table_schema', 'not in', ['INFORMATION_SCHEMA', 'information_schema', 'system'])))
      .execute(),
    sqlite: db =>
      db.selectFrom('sqlite_master')
        .select([
          'name as table',
          sql<string>`'main'`.as('schema'),
        ])
        .where('type', '=', 'table')
        .where('name', 'not like', 'sqlite_%')
        .execute(),
  }),
})
