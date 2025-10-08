import type { databases } from '~/drizzle'
import { pgNamespace } from '@conar/shared/schemas/postgres/catalog'
import { pgEnum, pgType } from '@conar/shared/schemas/postgres/internal'
import { type } from 'arktype'
import { eq, notInArray } from 'drizzle-orm'
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
    type: enumType,
    database,
    label: 'Enums',
    query: ({ db }) => db
      .select({
        schema: pgNamespace.nspname,
        name: pgType.typname,
        value: pgEnum.enumlabel,
      })
      .from(pgType)
      .innerJoin(pgEnum, eq(pgEnum.enumtypid, pgType.oid))
      .innerJoin(pgNamespace, eq(pgNamespace.oid, pgType.typnamespace))
      .where(notInArray(pgNamespace.nspname, ['pg_catalog', 'information_schema'])),
  })
}
