import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { PageSize } from '../components/table'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'

export function databaseTablesQuery(database: Database, schema: string) {
  const tableSchema = z.object({
    name: z.string(),
    schema: z.string(),
  })

  const queryMap: Record<DatabaseType, () => Promise<z.infer<typeof tableSchema>[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: `
          SELECT
            table_name as name,
            table_schema as schema
          FROM information_schema.tables
          WHERE table_schema = '${schema}'
          ORDER BY table_name ASC;
        `,
      })

      return result.rows.map(row => tableSchema.parse(row))
    },
  }

  return queryOptions({
    queryKey: ['database', database.id, schema, 'tables'],
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabaseTables(database: Database, schema: string) {
  return useQuery(databaseTablesQuery(database, schema))
}
export function databaseColumnsQuery(database: Database, table: string, schema: string) {
  const columnSchema = z.object({
    table: z.string(),
    name: z.string(),
    type: z.string(),
    editable: z.boolean(),
    default: z.string().nullable(),
    nullable: z.boolean(),
  })

  const queryMap: Record<DatabaseType, () => Promise<z.infer<typeof columnSchema>[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: `
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
      })

      return result.rows.map(row => columnSchema.parse(row))
    },
  }

  return queryOptions({
    queryKey: ['database', database.id, schema, 'table', table, 'columns'],
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabaseColumns(database: Database, table: string, schema: string) {
  return useSuspenseQuery(databaseColumnsQuery(database, table, schema))
}

export function databaseEnumsQuery(database: Database) {
  const enumSchema = z.object({
    schema: z.string(),
    name: z.string(),
    value: z.string(),
  })

  const queryMap: Record<DatabaseType, () => Promise<z.infer<typeof enumSchema>[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: `
          SELECT n.nspname AS enum_schema,
            t.typname AS enum_name,
            e.enumlabel AS enum_value
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
          ORDER BY enum_schema, enum_name, e.enumsortorder;
        `,
      })

      return result.rows.map(row => enumSchema.parse(row))
    },
  }

  return queryOptions({
    queryKey: ['database', database.id, 'enums'],
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabaseEnums(database: Database) {
  return useQuery(databaseEnumsQuery(database))
}

export function databaseRowsQuery(database: Database, table: string, schema: string, query?: { limit?: PageSize, page?: number }) {
  const countSchema = z.object({
    total: z.coerce.number(),
  })

  const _limit: PageSize = query?.limit ?? 50
  const _page = query?.page ?? 1

  const queryMap: Record<DatabaseType, () => Promise<{
    rows: Record<string, unknown>[]
    total: number
  }>> = {
    postgres: async () => {
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

      const tableCount = countSchema.parse(countResult.rows[0])

      return {
        rows: result.rows,
        total: Number(tableCount.total || 0),
      }
    },
  }

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
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabaseRows(database: Database, table: string, schema: string, query: { limit?: PageSize, page?: number } = {}) {
  return useQuery(databaseRowsQuery(database, table, schema, query))
}

export function databaseSchemasQuery(database: Database) {
  const schemaSchema = z.object({
    name: z.string(),
  })

  const queryMap: Record<DatabaseType, () => Promise<z.infer<typeof schemaSchema>[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: `
          SELECT schema_name as name
          FROM information_schema.schemata
          WHERE schema_name NOT LIKE 'pg_temp%'
            AND schema_name NOT LIKE 'pg_toast_temp%'
            AND schema_name NOT LIKE 'temp%'
            AND schema_name NOT IN ('information_schema', 'performance_schema')
          ORDER BY schema_name ASC;
        `,
      })

      return result.rows.map(row => schemaSchema.parse(row))
    },
  }

  return queryOptions({
    queryKey: ['database', database.id, 'schemas'],
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabaseSchemas(database: Database) {
  return useQuery(databaseSchemasQuery(database))
}
