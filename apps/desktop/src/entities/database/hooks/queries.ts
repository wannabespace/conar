import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { PageSize } from '../components/table'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { getSavedDatabaseSchema } from '~/entities/database'

export function databaseTablesQuery(database: Database, schema?: string) {
  const _schema = schema ?? getSavedDatabaseSchema(database.id)

  const queryMap: Record<DatabaseType, (schema: string) => string> = {
    postgres: schema => `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = '${schema}'
      ORDER BY table_name;
    `,
  }

  return queryOptions({
    queryKey: ['database', database.id, _schema, 'tables'],
    queryFn: async () => {
      const response = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: queryMap[database.type](_schema),
      }) as {
        table_name: string
      }[]

      return response.map(t => ({
        name: t.table_name,
        schema: _schema,
      }))
    },
  })
}

export function useDatabaseTables(database: Database, schema?: string) {
  return useQuery(databaseTablesQuery(database, schema))
}
export function databaseColumnsQuery(database: Database, table: string, schema?: string) {
  const _schema = schema ?? getSavedDatabaseSchema(database.id)

  const queryMap: Record<DatabaseType, (table: string, schema: string) => string> = {
    postgres: (table, schema) => `
      SELECT
        c.table_name,
        c.column_name,
        CASE
          WHEN c.data_type = 'USER-DEFINED' THEN
            (SELECT t.typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
             WHERE t.oid = c.udt_name::regtype)
          ELSE c.data_type
        END as data_type,
        c.character_maximum_length,
        c.column_default,
        c.is_nullable
      FROM
        information_schema.columns c
      WHERE
        c.table_name = '${table}'
        AND c.table_schema = '${schema}'
      ORDER BY
        c.ordinal_position;
    `,
  }

  return queryOptions({
    queryKey: ['database', database.id, 'schema', _schema, 'table', table, 'columns'],
    queryFn: async () => {
      const result = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: queryMap[database.type](table, _schema),
      })

      return result as {
        table_name: string
        column_name: string
        data_type: string
        character_maximum_length: number
        column_default: string
        is_nullable: string
      }[]
    },
  })
}

export function useDatabaseColumns(database: Database, table: string) {
  return useSuspenseQuery(databaseColumnsQuery(database, table))
}

export function databaseEnumsQuery(database: Database) {
  const queryMap: Record<DatabaseType, string> = {
    postgres: `
      SELECT n.nspname AS enum_schema,
        t.typname AS enum_name,
        e.enumlabel AS enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      ORDER BY enum_schema, enum_name, e.enumsortorder;
    `,
  }

  return queryOptions({
    queryKey: ['database', database.id, 'enums'],
    queryFn: async () => {
      const response = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: queryMap[database.type],
      })

      return response as {
        enum_schema: string
        enum_name: string
        enum_value: string
      }[]
    },
  })
}

export function useDatabaseEnums(database: Database) {
  return useQuery(databaseEnumsQuery(database))
}

export function databaseRowsQuery(database: Database, table: string, query?: { schema?: string, limit?: PageSize, page?: number }) {
  const _schema = query?.schema ?? getSavedDatabaseSchema(database.id)
  const _limit: PageSize = query?.limit ?? 50
  const _page = query?.page ?? 1

  return queryOptions({
    queryKey: [
      'database',
      database.id,
      'table',
      table,
      'rows',
      {
        schema: _schema,
        limit: _limit,
        page: _page,
      },
    ],
    queryFn: async () => {
      const rows = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: `SELECT * FROM "${_schema}"."${table}" LIMIT ${_limit} OFFSET ${(_page - 1) * _limit}`,
      }) as {
        [key: string]: string | number | boolean | null
      }[]

      const countResponse = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: `SELECT COUNT(*) as total FROM "${_schema}"."${table}"`,
      }) as { total: number }[]

      return {
        rows,
        total: Number(countResponse[0]?.total || 0),
      }
    },
  })
}

export function useDatabaseRows(database: Database, table: string, query: { schema?: string, limit?: PageSize, page?: number } = {}) {
  return useQuery(databaseRowsQuery(database, table, query))
}

export function databaseSchemasQuery(database: Database) {
  return queryOptions({
    queryKey: ['database', database.id, 'schemas'],
    queryFn: async () => {
      const response = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: 'SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE \'pg_temp%\' AND schema_name NOT LIKE \'pg_toast_temp%\' AND schema_name NOT LIKE \'temp%\' AND schema_name NOT IN (\'information_schema\', \'performance_schema\')',
      })

      return response as {
        schema_name: string
      }[]
    },
  })
}

export function useDatabaseSchemas(database: Database) {
  return useQuery(databaseSchemasQuery(database))
}
