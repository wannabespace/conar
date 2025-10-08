import type { databases } from '~/drizzle'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { enumsSql } from '../sql/enums'

export function databaseEnumsQuery({ database }: { database: typeof databases.$inferSelect }) {
  return queryOptions({
    queryKey: ['database', database.id, 'enums'],
    queryFn: async () => {
      const enums = await enumsSql(database)

      const map = new Map<string, { schema: string, name: string, values: string[] }>()

      for (const { schema, name, value } of enums) {
        const key = `${schema}.${name}`
        if (!map.has(key)) {
          map.set(key, { schema, name, values: [value] })
        }
        else {
          map.get(key)!.values.push(value)
        }
      }

      return Array.from(map.values())
    },
  })
}

export function useDatabaseEnums(...params: Parameters<typeof databaseEnumsQuery>) {
  return useQuery(databaseEnumsQuery(...params))
}
