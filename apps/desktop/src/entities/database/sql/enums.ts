import { type } from 'arktype'
import { createQuery } from '../query'

export const enumType = type({
  schema: 'string',
  name: 'string',
  values: 'string[]',
})

export const enumsQuery = createQuery({
  type: enumType.array(),
  query: () => ({
    postgres: async ({ db }) => {
      const query = await db
        .selectFrom('pg_type')
        .innerJoin('pg_enum', 'pg_type.oid', 'pg_enum.enumtypid')
        .innerJoin('pg_catalog.pg_namespace', 'pg_type.typnamespace', 'pg_catalog.pg_namespace.oid')
        .select([
          'pg_catalog.pg_namespace.nspname as schema',
          'pg_type.typname as name',
          'pg_enum.enumlabel as value',
        ])
        .where('pg_catalog.pg_namespace.nspname', 'not in', ['pg_catalog', 'information_schema'])
        .execute()

      const grouped = new Map<string, { schema: string, name: string, values: string[] }>()

      for (const row of query) {
        const key = `${row.schema}.${row.name}`
        if (!grouped.has(key)) {
          grouped.set(key, { schema: row.schema, name: row.name, values: [row.value] })
        }
        else {
          grouped.get(key)!.values.push(row.value)
        }
      }

      return Array.from(grouped.values())
    },
    mysql: async ({ db }) => {
      const query = await db
        .selectFrom('information_schema.COLUMNS')
        .select([
          'TABLE_SCHEMA as schema',
          'TABLE_NAME as table',
          'COLUMN_TYPE as value',
          'COLUMN_NAME as name',
        ])
        .where('DATA_TYPE', '=', 'enum')
        .where('TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])
        .groupBy('TABLE_SCHEMA')
        .groupBy('TABLE_NAME')
        .groupBy('COLUMN_NAME')
        .groupBy('COLUMN_TYPE')
        .execute()

      return query.map(row => ({
        schema: row.schema,
        name: `${row.table}.${row.name}`,
        values: row.value
          .replace(/^enum\(/, '')
          .replace(/\)$/, '')
          .split(',')
          .map(v => v.slice(1, -1).trim()),
      }))
    },
  }),
})
