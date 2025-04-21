import type { DatabaseType } from '@connnect/shared/enums/database-type'
import { prepareSql } from '@connnect/shared/utils/helpers'
import { type } from 'arktype'

export const enumType = type({
  schema: 'string',
  name: 'string',
  values: 'string[]',
})

export function enumsSql(): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        t.typname as name,
        n.nspname as schema,
        coalesce(t_enums.values, '[]') as values
      FROM pg_type t
      LEFT JOIN pg_namespace n ON n.oid = t.typnamespace
      LEFT JOIN (
        SELECT
          enumtypid,
          jsonb_agg(enumlabel ORDER BY enumsortorder) as values
        FROM pg_enum
        GROUP BY enumtypid
      ) as t_enums ON t_enums.enumtypid = t.oid
      WHERE t.typtype = 'e'
      ORDER BY schema, name;
    `),
  }
}
