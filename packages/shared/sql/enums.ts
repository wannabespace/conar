import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'
import { type } from 'arktype'

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

export function enumsSql(): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        ns.nspname AS schema,
        t.typname AS name,
        e.enumlabel AS value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace ns ON ns.oid = t.typnamespace
      WHERE ns.nspname NOT IN ('pg_catalog', 'information_schema')
    `),
  }
}
