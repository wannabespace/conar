import { type } from 'arktype'
import { createQuery } from '../query'

export const enumType = type({
  schema: 'string',
  name: 'string',
  value: 'string',
})

export const enumsQuery = createQuery({
  type: enumType.array(),
  query: () => ({
    postgres: ({ db }) => db
      .selectFrom('pg_type')
      .innerJoin('pg_enum', 'pg_type.oid', 'pg_enum.enumtypid')
      .innerJoin('pg_catalog.pg_namespace', 'pg_type.typnamespace', 'pg_catalog.pg_namespace.oid')
      .select([
        'pg_catalog.pg_namespace.nspname as schema',
        'pg_type.typname as name',
        'pg_enum.enumlabel as value',
      ])
      .where('pg_catalog.pg_namespace.nspname', 'not in', ['pg_catalog', 'information_schema'])
      .execute(),
    mysql: ({ db }) => db
      .selectFrom('information_schema.COLUMNS')
      .select([
        'TABLE_SCHEMA as schema',
        'COLUMN_TYPE as value',
        'COLUMN_NAME as name',
      ])
      .where('DATA_TYPE', '=', 'enum')
      .where('TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])
      .groupBy('value')
      .groupBy('TABLE_SCHEMA')
      .groupBy('COLUMN_NAME')
      .execute(),
  }),
})
