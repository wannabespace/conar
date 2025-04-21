import type { DatabaseType } from '@connnect/shared/enums/database-type'
import { prepareSql } from '@connnect/shared/utils/helpers'
import { type } from 'arktype'

export const enumType = type({
  schema: 'string',
  name: 'string',
  value: 'string',
})

export function enumsSql(): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT n.nspname AS schema,
        t.typname AS name,
        e.enumlabel AS value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      ORDER BY schema, name, e.enumsortorder;
    `),
  }
}
