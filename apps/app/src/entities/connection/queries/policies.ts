import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { memoize } from 'memoza'

import type { ConnectionResource } from '../core/sync'
import { connectionResourceToQueryParams, createQuery } from '../runtime/query'

export const policyType = type({
  check: 'string | null',
  command: 'string',
  enabled: 'boolean',
  name: 'string',
  roles: 'string[]',
  schema: 'string',
  table: 'string',
  type: '"PERMISSIVE" | "RESTRICTIVE"',
  using: 'string | null',
})

const REPLACE_SINGLE_QUOTES_REGEX = /'/gu

const mssqlOperationMap = {
  0: 'ALL',
  1: 'SELECT',
  2: 'INSERT',
  3: 'UPDATE',
  4: 'DELETE',
} as const

const query = createQuery({
  query: {
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
      return rows.map((row) => ({
        check: null,
        command: 'ALL',
        enabled: true,
        name: row.name,
        roles: [],
        schema: row.database,
        table: row.table,
        type: row.is_restrictive === 1 ? 'RESTRICTIVE' : 'PERMISSIVE',
        using: row.select_filter,
      }))
    },
    mssql: async (db) => {
      const rows = await db
        .selectFrom('sys.security_policies as sp')
        .leftJoin(
          'sys.security_predicates as pr',
          'sp.object_id',
          'pr.object_id'
        )
        .leftJoin('sys.tables as t', 'pr.target_object_id', 't.object_id')
        .leftJoin(
          'sys.schemas as table_schema',
          't.schema_id',
          'table_schema.schema_id'
        )
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
      return rows.map((row) => ({
        check: null,
        command:
          mssqlOperationMap[row.operation as keyof typeof mssqlOperationMap] ||
          'ALL',
        enabled: row.is_enabled,
        name: row.name,
        roles: [],
        schema: row.schema || 'dbo',
        table: row.table ?? '',
        type: 'RESTRICTIVE',
        using: row.predicate_definition || null,
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
        .where('TABLE_SCHEMA', 'not in', [
          'mysql',
          'information_schema',
          'performance_schema',
          'sys',
        ])
        .execute()
      return rows.map((row) => ({
        check: null,
        command: row.PRIVILEGE_TYPE,
        enabled: true,
        name: `${row.GRANTEE} - ${row.PRIVILEGE_TYPE}`,
        roles: [row.GRANTEE.replace(REPLACE_SINGLE_QUOTES_REGEX, '')],
        schema: row.TABLE_SCHEMA,
        table: row.TABLE_NAME,
        type: 'PERMISSIVE',
        using: null,
      }))
    },
    postgres: async (db) => {
      const rows = await db
        .selectFrom('pg_catalog.pg_policies')
        .select([
          'schemaname',
          'tablename',
          'policyname',
          'permissive',
          'roles',
          'cmd',
          'qual',
          'with_check',
        ])
        .execute()
      return rows.map((row) => ({
        check: row.with_check,
        command: row.cmd,
        enabled: true,
        name: row.policyname,
        roles: row.roles,
        schema: row.schemaname,
        table: row.tablename,
        type: row.permissive,
        using: row.qual,
      }))
    },
  },
  type: policyType.array(),
})

export const resourcePoliciesQuery = memoize(
  ({ connectionResource }: { connectionResource: ConnectionResource }) =>
    queryOptions({
      queryFn: async () =>
        query.run(await connectionResourceToQueryParams(connectionResource)),
      queryKey: ['connection-resource', connectionResource.id, 'policies'],
    })
)
