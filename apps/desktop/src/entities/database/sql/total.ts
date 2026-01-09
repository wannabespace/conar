import type { ActiveFilter } from '@conar/shared/filters'
import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'
import { buildWhere } from './rows'

export const totalQuery = createQuery({
  type: type({
    count: 'string',
    isEstimated: 'boolean',
  }),
  query: ({
    schema,
    table,
    filters,
    enforceExactCount: _enforceExactCount = true,
  }: { schema: string, table: string, filters?: ActiveFilter[], enforceExactCount?: boolean }) => ({
    postgres: async (db) => {
      if (!_enforceExactCount && !filters?.length) {
        const estimate = await db
          .withSchema('pg_catalog')
          .withTables<{
          pg_class: { reltuples: number, relname: string, relnamespace: number }
          pg_namespace: { oid: number, nspname: string }
        }>()
          .selectFrom('pg_class')
          .innerJoin('pg_namespace', 'pg_namespace.oid', 'pg_class.relnamespace')
          .select('pg_class.reltuples as count')
          .where('pg_namespace.nspname', '=', schema)
          .where('pg_class.relname', '=', table)
          .executeTakeFirst()

        if (estimate && Number(estimate.count) >= 0) {
          return { 
        count: String(Math.round(Number(estimate.count))), 
        isEstimated: true 
      }
        }
      }

      const query = await db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .execute()

      return { count: String(query[0]?.total ?? 0), isEstimated: false }
    },

    mysql: async (db) => {
      if (!_enforceExactCount && !filters?.length) {
        const estimate = await db
          .withSchema('information_schema')
          .withTables<{
          TABLES: { TABLE_SCHEMA: string, TABLE_NAME: string, TABLE_ROWS: number }
        }>()
          .selectFrom('TABLES')
          .select('TABLE_ROWS as count')
          .where('TABLE_SCHEMA', '=', schema)
          .where('TABLE_NAME', '=', table)
          .executeTakeFirst()

        if (estimate?.count) {
          return { count: String(estimate.count), isEstimated: true }
        }
      }

      const query = await db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .execute()

      return { count: String(query[0]?.total ?? 0), isEstimated: false }
    },

    mssql: async (db) => {
      if (!_enforceExactCount && !filters?.length) {
        const estimate = await db
          .withSchema('information_schema')
          .withTables<{
          TABLES: { TABLE_SCHEMA: string, TABLE_NAME: string, TABLE_ROWS: number }
        }>()
          .selectFrom('TABLES')
          .select('TABLE_ROWS as count')
          .where('TABLE_SCHEMA', '=', schema)
          .where('TABLE_NAME', '=', table)
          .executeTakeFirst()

        if (estimate?.count) {
          return { count: String(estimate.count), isEstimated: true }
        }
      }

      const query = await db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .execute()

      return { count: String(query[0]?.total ?? 0), isEstimated: false }
    },

    clickhouse: async (db) => {
      if (!_enforceExactCount && !filters?.length) {
        const estimate = await db
          .withSchema('system')
          .withTables<{
          parts: { database: string, table: string, rows: number, active: number }
        }>()
          .selectFrom('parts')
          .select(db.fn.sum(sql.ref('rows')).as('count'))
          .where('database', '=', schema)
          .where('table', '=', table)
          .where('active', '=', 1)
          .executeTakeFirst()

        if (estimate?.count) {
          return { count: String(estimate.count), isEstimated: true }
        }
      }

      const query = await db
        .withSchema(schema)
        .withTables<{ [table: string]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .execute()

      return { count: String(query[0]?.total ?? 0), isEstimated: false }
    },
  }),
})
