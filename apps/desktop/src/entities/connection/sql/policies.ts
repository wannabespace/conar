import { type } from 'arktype'
import { createQuery } from '../query'

export const policyType = type({
  schema: 'string',
  table: 'string',
  name: 'string',
  type: '"PERMISSIVE" | "RESTRICTIVE"',
  command: 'string',
  roles: 'string[]',
  using: 'string | null',
  check: 'string | null',
  enabled: 'boolean',
})

const pgCommandMap = {
  'r': 'SELECT',
  'a': 'INSERT',
  'w': 'UPDATE',
  'd': 'DELETE',
  '*': 'ALL',
} as const

const mssqlOperationMap = {
  0: 'ALL',
  1: 'SELECT',
  2: 'INSERT',
  3: 'UPDATE',
  4: 'DELETE',
} as const

export const policiesQuery = createQuery({
  type: policyType.array(),
  query: () => ({
    postgres: async (db) => {
      const rows = await db
        .selectFrom('pg_catalog.pg_policy as p')
        .innerJoin('pg_catalog.pg_class as c', 'p.polrelid', 'c.oid')
        .innerJoin('pg_catalog.pg_namespace as n', 'c.relnamespace', 'n.oid')
        .select(({ fn }) => [
          'n.nspname as schema',
          'c.relname as table',
          'p.polname as name',
          'p.polpermissive',
          'p.polcmd',
          fn('pg_get_expr', ['p.polqual', 'p.polrelid']).as('using'),
          fn('pg_get_expr', ['p.polwithcheck', 'p.polrelid']).as('check'),
        ])
        .execute()
      return rows.map(row => ({
        schema: row.schema,
        table: row.table,
        name: row.name,
        type: row.polpermissive ? 'PERMISSIVE' : 'RESTRICTIVE',
        command: pgCommandMap[row.polcmd as keyof typeof pgCommandMap] || 'ALL',
        roles: [],
        using: row.using as string | null,
        check: row.check as string | null,
        enabled: true,
      }))
    },
    mysql: async (db) => {
      // MySQL doesn't support regular RLS, but we can show table privileges
      const rows = await db
        .selectFrom('information_schema.TABLE_PRIVILEGES')
        .select([
          'TABLE_SCHEMA',
          'TABLE_NAME',
          'GRANTEE',
          'PRIVILEGE_TYPE',
          'IS_GRANTABLE',
        ])
        .where('TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])
        .execute()
      return rows.map(row => ({
        schema: row.TABLE_SCHEMA,
        table: row.TABLE_NAME,
        name: `${row.GRANTEE} - ${row.PRIVILEGE_TYPE}`,
        type: 'PERMISSIVE',
        command: row.PRIVILEGE_TYPE,
        roles: [row.GRANTEE.replace(/'/g, '')],
        using: null,
        check: null,
        enabled: true,
      }))
    },
    mssql: async (db) => {
      const rows = await db
        .selectFrom('sys.security_policies as sp')
        .leftJoin('sys.security_predicates as pr', 'sp.object_id', 'pr.object_id')
        .leftJoin('sys.tables as t', 'pr.target_object_id', 't.object_id')
        .leftJoin('sys.schemas as table_schema', 't.schema_id', 'table_schema.schema_id')
        .select([
          'table_schema.name as schema',
          't.name as table',
          'sp.name',
          'sp.is_enabled',
          'pr.operation',
          'pr.predicate_definition',
        ])
        .where('t.name', 'is not', null)
        .execute()
      return rows.map(row => ({
        schema: row.schema || 'dbo',
        table: row.table!,
        name: row.name,
        type: 'RESTRICTIVE',
        command: mssqlOperationMap[row.operation as keyof typeof mssqlOperationMap] || 'ALL',
        roles: [],
        using: row.predicate_definition || null,
        check: null,
        enabled: row.is_enabled,
      }))
    },
    clickhouse: async (db) => {
      const rows = await db
        .selectFrom('system.row_policies')
        .select([
          'database',
          'table',
          'name',
          'is_restrictive',
          'select_filter',
        ])
        .where('database', 'not in', ['system', 'information_schema'])
        .execute()
      return rows.map(row => ({
        schema: row.database,
        table: row.table,
        name: row.name,
        type: row.is_restrictive === 1 ? 'RESTRICTIVE' : 'PERMISSIVE',
        command: 'ALL',
        roles: [],
        using: row.select_filter,
        check: null,
        enabled: true,
      }))
    },
  }),
})
