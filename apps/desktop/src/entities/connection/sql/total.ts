import type { ActiveFilter } from '@conar/shared/filters'
import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'
import { buildWhere } from './rows'

export const totalQuery = createQuery({
  type: type({
    count: 'number',
    isEstimated: 'boolean',
  }),
  query: ({
    schema,
    table,
    filters,
    exact,
  }: {
    schema: string
    table: string
    filters?: ActiveFilter[]
    exact?: boolean
  }) => ({
    postgres: async (db) => {
      if (!exact && !filters?.length) {
        const estimate = await db
          .withSchema('pg_catalog')
          .selectFrom('pg_catalog.pg_class')
          .innerJoin('pg_catalog.pg_namespace', 'pg_catalog.pg_namespace.oid', 'pg_catalog.pg_class.relnamespace')
          .select('pg_catalog.pg_class.reltuples as count')
          .where('pg_catalog.pg_namespace.nspname', '=', schema)
          .where('pg_catalog.pg_class.relname', '=', table)
          .executeTakeFirst()

        if (estimate && estimate.count !== null && estimate.count >= 0) {
          return {
            count: Math.round(estimate.count),
            isEstimated: true,
          }
        }
      }

      const query = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .executeTakeFirst()

      return { count: Number(query?.total ?? 0), isEstimated: false }
    },
    mysql: async (db) => {
      if (!exact && !filters?.length) {
        const estimate = await db
          .withSchema('information_schema')
          .selectFrom('information_schema.TABLES')
          .select('TABLE_ROWS as count')
          .where('TABLE_SCHEMA', '=', schema)
          .where('TABLE_NAME', '=', table)
          .executeTakeFirst()

        if (estimate && estimate.count !== null && estimate.count >= 0) {
          return { count: estimate.count, isEstimated: true }
        }
      }

      const query = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .executeTakeFirst()

      return { count: Number(query?.total ?? 0), isEstimated: false }
    },

    mssql: async (db) => {
      const query = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .executeTakeFirst()

      return {
        count: Number(query?.total ?? 0),
        isEstimated: false,
      }
    },

    clickhouse: async (db) => {
      if (!exact && !filters?.length) {
        const estimate = await db
          .withSchema('system')
          .selectFrom('system.parts')
          .select(db.fn.sum(sql.ref('rows')).as('count'))
          .where('database', '=', schema)
          .where('table', '=', table)
          .where('active', '=', 1)
          .executeTakeFirst()

        if (estimate && Number(estimate.count) >= 0) {
          return { count: Number(estimate.count), isEstimated: true }
        }
      }

      const query = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .executeTakeFirst()

      return { count: Number(query?.total ?? 0), isEstimated: false }
    },
    sqlite: async (db) => {
      const query = await db
        .withSchema(schema)
        .withTables<{ [table]: Record<string, unknown> }>()
        .selectFrom(table)
        .select(db.fn.countAll().as('total'))
        .$if(filters !== undefined, qb => qb.where(eb => buildWhere(eb, filters!)))
        .executeTakeFirst()

      return { count: Number(query?.total ?? 0), isEstimated: false }
    },
  }),
})
