import type { ConnectionType } from '@connnect/shared/enums/connection-type'
import type { Connection } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { getSavedDatabaseSchema } from '~/routes/(protected)/_dashboard/database/-hooks/schema'

export function databaseTablesQuery(connection: Connection, schema?: string) {
  const _schema = schema ?? getSavedDatabaseSchema(connection.id)

  const queryMap: Record<ConnectionType, (schema: string) => string> = {
    postgres: schema => `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = '${schema}'
      ORDER BY table_name;
    `,
  }

  return queryOptions({
    queryKey: ['database', connection.id, _schema, 'tables'],
    queryFn: async () => {
      const response = await window.electron.databases.query({
        type: connection.type,
        connectionString: connection.connectionString,
        query: queryMap[connection.type](_schema),
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

export function useDatabaseTables(connection: Connection, schema?: string) {
  return useQuery(databaseTablesQuery(connection, schema))
}

export function databaseColumnsQuery(connection: Connection, table: string) {
  const queryMap: Record<ConnectionType, string> = {
    postgres: `
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        column_default,
        is_nullable
      FROM
        information_schema.columns
      WHERE
        table_name = '${table}'
      ORDER BY
        ordinal_position;
    `,
  }

  return queryOptions({
    queryKey: ['database', connection.id, 'table', table, 'columns'],
    queryFn: async () => {
      const result = await window.electron.databases.query({
        type: connection.type,
        connectionString: connection.connectionString,
        query: queryMap[connection.type],
      })

      return result as {
        column_name: string
        data_type: string
        character_maximum_length: number
        column_default: string
        is_nullable: string
      }[]
    },
  })
}

export function useDatabaseColumns(connection: Connection, table: string) {
  return useQuery(databaseColumnsQuery(connection, table))
}

export function databaseEnumsQuery(connection: Connection) {
  const queryMap: Record<ConnectionType, string> = {
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
    queryKey: ['database', connection.id, 'enums'],
    queryFn: async () => {
      const response = await window.electron.databases.query({
        type: connection.type,
        connectionString: connection.connectionString,
        query: queryMap[connection.type],
      })

      return response as {
        enum_schema: string
        enum_name: string
        enum_value: string
      }[]
    },
  })
}

export function useDatabaseEnums(connection: Connection) {
  return useQuery(databaseEnumsQuery(connection))
}

export function databaseRowsQuery(connection: Connection, table: string, query: { schema?: string, limit?: number }) {
  const _schema = query.schema ?? getSavedDatabaseSchema(connection.id)

  return queryOptions({
    queryKey: ['database', connection.id, 'schema', _schema, 'table', table, 'rows'],
    queryFn: async () => {
      const response = await window.electron.databases.query({
        type: connection.type,
        connectionString: connection.connectionString,
        query: `SELECT * FROM "${_schema}"."${table}" LIMIT ${query.limit ?? 50}`,
      })

      return response as {
        [key: string]: string | number | boolean | null
      }[]
    },
  })
}

export function useDatabaseRows(connection: Connection, table: string, query: { schema?: string, limit?: number } = {}) {
  return useQuery(databaseRowsQuery(connection, table, query))
}

export function databaseSchemasQuery(connection: Connection) {
  return queryOptions({
    queryKey: ['database', connection.id, 'schemas'],
    queryFn: async () => {
      const response = await window.electron.databases.query({
        type: connection.type,
        connectionString: connection.connectionString,
        query: 'SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE \'pg_temp%\' AND schema_name NOT LIKE \'pg_toast_temp%\' AND schema_name NOT LIKE \'temp%\' AND schema_name NOT IN (\'information_schema\', \'performance_schema\')',
      })

      return response as {
        schema_name: string
      }[]
    },
  })
}

export function useDatabaseSchemas(connection: Connection) {
  return useQuery(databaseSchemasQuery(connection))
}
