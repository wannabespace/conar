import type { databases } from '~/drizzle'
import { type } from 'arktype'
import { runSql } from '../query'

export const enumType = type({
  schema: 'string',
  name: 'string',
  value: 'string',
})

export const enumsType = enumType.array().pipe((rows) => {
  const map = new Map<string, { schema: string, name: string, values: string[] }>()

  for (const { schema, name, value } of rows) {
    const key = `${schema}.${name}`
    if (!map.has(key)) {
      map.set(key, { schema, name, values: [value] })
    }
    else {
      map.get(key)!.values.push(value)
    }
  }

  return Array.from(map.values())
})

export function enumsSql(database: typeof databases.$inferSelect) {
  return runSql({
    validate: enumType.assert,
    database,
    label: 'Enums',
    query: {
      postgres: db => db
        .selectFrom('pg_type')
        .innerJoin('pg_enum', 'pg_type.oid', 'pg_enum.enumtypid')
        .innerJoin('pg_catalog.pg_namespace', 'pg_type.typnamespace', 'pg_catalog.pg_namespace.oid')
        .select([
          'pg_catalog.pg_namespace.nspname as schema',
          'pg_type.typname as name',
          'pg_enum.enumlabel as value',
        ])
        .where('pg_catalog.pg_namespace.nspname', 'not in', ['pg_catalog', 'information_schema'])
        .$assertType<typeof enumType.inferIn>()
        .compile(),
      mysql: db => db
        .selectFrom('information_schema.COLUMNS')
        .select([
          'TABLE_SCHEMA as schema',
          'COLUMN_TYPE as value',
          'COLUMN_NAME as name',
        ])
        .where('DATA_TYPE', '=', 'enum')
        .where('TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])
        .$assertType<typeof enumType.inferIn>()
        .compile(),
    },
  })
}
