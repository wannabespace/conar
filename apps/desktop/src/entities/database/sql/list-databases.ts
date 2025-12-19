import { type } from 'arktype'
import { createQuery } from '../query'

export const listDatabasesType = type('string[]')

export const listDatabasesQuery = createQuery({
  type: listDatabasesType,
  query: () => ({
    postgres: db => db
      .selectFrom('pg_catalog.pg_database')
      .select('datname')
      .where('datistemplate', '=', false)
      .orderBy('datname')
      .execute()
      .then(rows => rows.map(r => r.datname)),

    mysql: db => db
      .selectFrom('information_schema.SCHEMATA')
      .select('SCHEMA_NAME')
      .orderBy('SCHEMA_NAME')
      .execute()
      .then(rows => rows.map(r => r.SCHEMA_NAME)),

    mssql: db => db
      .selectFrom('sys.databases')
      .select('name')
      .orderBy('name')
      .execute()
      .then(rows => rows.map(r => r.name)),

    clickhouse: db => db
      .selectFrom('system.databases')
      .select('name')
      .orderBy('name')
      .execute()
      .then(rows => rows.map(r => r.name)),
  }),
})
