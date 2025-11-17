import type { databases } from '~/drizzle'
import { type } from 'arktype'
import { runSql } from '../query'

export const enumType = type({
  schema: 'string',
  name: 'string',
  value: 'string',
})

const label = 'Enums'

export function enumsSql(database: typeof databases.$inferSelect) {
  return runSql(database, {
    validate: enumType.assert,
    query: {
      postgres: ({ qb, execute, log }) => {
        const query = qb
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
          .compile()

        const promise = execute(query)

        log({ ...query, promise, label })

        return promise
      },
      mysql: ({ qb, execute, log }) => {
        const query = qb
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
          .$assertType<typeof enumType.inferIn>()
          .compile()

        const promise = execute(query)

        log({ ...query, promise, label })

        return promise
      },
    },
  })
}
