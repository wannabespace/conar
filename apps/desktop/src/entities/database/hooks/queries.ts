import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { PageSize } from '../components/table'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query'

export function databaseTablesQuery(database: Database, schema: string) {
  const queryMap: Record<DatabaseType, () => string> = {
    postgres: () => `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = '${schema}'
      ORDER BY table_name;
    `,
  }

  return queryOptions({
    queryKey: ['database', database.id, schema, 'tables'],
    queryFn: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: queryMap[database.type](),
      })
      const tables = result.rows as {
        table_name: string
      }[]

      return tables.map(t => ({
        name: t.table_name,
        schema,
      }))
    },
  })
}

export function useDatabaseTables(database: Database, schema: string) {
  return useQuery(databaseTablesQuery(database, schema))
}
export function databaseColumnsQuery(database: Database, table: string, schema: string) {
  const queryMap: Record<DatabaseType, (table: string, schema: string) => string> = {
    postgres: (table, schema) => `
      SELECT
        c.table_name AS table,
        c.column_name AS name,
        c.column_default AS default,
        CASE
          WHEN c.data_type = 'USER-DEFINED' THEN (
            SELECT t.typname
            FROM pg_catalog.pg_type t
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typname = c.udt_name
          )
          ELSE c.data_type
        END AS type,
        CASE
          WHEN c.is_nullable = 'YES' THEN true
          ELSE false
        END AS nullable,
        CASE
          WHEN c.is_updatable = 'YES' THEN true
          ELSE false
        END AS editable
      FROM information_schema.columns c
      WHERE c.table_schema = '${schema}'
        AND c.table_name = '${table}'
      ORDER BY c.ordinal_position;
    `,
  }

  return queryOptions({
    queryKey: ['database', database.id, 'schema', schema, 'table', table, 'columns'],
    queryFn: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: queryMap[database.type](table, schema),
      })

      return result.rows as {
        table: string
        name: string
        type: string
        editable: boolean
        default: string
        nullable: boolean
      }[]
    },
  })
}

export function useDatabaseColumns(database: Database, table: string, schema: string) {
  return useSuspenseQuery(databaseColumnsQuery(database, table, schema))
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
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: queryMap[database.type],
      })

      return result.rows as {
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

export function databaseRowsQuery(database: Database, table: string, schema: string, query?: { limit?: PageSize, page?: number }) {
  const _limit: PageSize = query?.limit ?? 50
  const _page = query?.page ?? 1

  return queryOptions({
    queryKey: [
      'database',
      database.id,
      'table',
      schema,
      table,
      'rows',
      {
        limit: _limit,
        page: _page,
      },
    ],
    queryFn: async () => {
      const [[result], [countResult]] = await Promise.all([
        window.electron.databases.query({
          type: database.type,
          connectionString: database.connectionString,
          query: `SELECT * FROM "${schema}"."${table}" LIMIT ${_limit} OFFSET ${(_page - 1) * _limit}`,
        }),
        window.electron.databases.query({
          type: database.type,
          connectionString: database.connectionString,
          query: `SELECT COUNT(*) as total FROM "${schema}"."${table}"`,
        }),
      ])

      const rows = result.rows as {
        [key: string]: string | number | boolean | null
      }[]

      const tableCount = countResult.rows[0] as { total: number }

      return {
        rows,
        total: Number(tableCount.total || 0),
      }
    },
  })
}

export function useDatabaseRows(database: Database, table: string, schema: string, query: { limit?: PageSize, page?: number } = {}) {
  return useQuery(databaseRowsQuery(database, table, schema, query))
}

export function databaseSchemasQuery(database: Database) {
  return queryOptions({
    queryKey: ['database', database.id, 'schemas'],
    queryFn: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: 'SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE \'pg_temp%\' AND schema_name NOT LIKE \'pg_toast_temp%\' AND schema_name NOT LIKE \'temp%\' AND schema_name NOT IN (\'information_schema\', \'performance_schema\')',
      })

      return result.rows as {
        schema_name: string
      }[]
    },
  })
}

export function useDatabaseSchemas(database: Database) {
  return useQuery(databaseSchemasQuery(database))
}
