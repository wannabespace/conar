import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import * as z from 'zod'
import { dbQuery } from '~/lib/query'
import { contextSql } from '../sql/context'

const databaseContextSchema = z.object({
  schemas: z.array(z.object({
    schema: z.string(),
    tables: z.array(z.object({
      name: z.string(),
      columns: z.array(z.object({
        name: z.string(),
        type: z.string(),
        nullable: z.boolean(),
        default: z.nullable(z.string()),
        editable: z.boolean(),
        // constraints: z.array(z.object({
        //   name: z.string(),
        //   type: z.string(),
        //   related_column: z.nullable(z.string()),
        //   related_table: z.nullable(z.string()),
        // })).nullable().transform(data => data ?? []),
      })).nullable().transform(data => data ?? []),
    })).nullable().transform(data => data ?? []),
  })).nullable().transform(data => data ?? []),
  enums: z.array(z.object({
    schema: z.string(),
    name: z.string(),
    value: z.string(),
  })).nullable().transform(data => data ?? []),
})

export function databaseContextQuery(database: Database) {
  return queryOptions({
    queryKey: ['database', database.id, 'context'],
    queryFn: async () => {
      const [result] = await dbQuery({
        type: database.type,
        connectionString: database.connectionString,
        query: contextSql()[database.type],
      })

      const parsed = databaseContextSchema.parse(result.rows[0].database_context)

      return {
        ...parsed,
        schemas: parsed.schemas.toSorted((a, b) => {
          if (a.schema === 'public' && b.schema !== 'public')
            return -1
          if (b.schema === 'public' && a.schema !== 'public')
            return 1
          return a.schema.localeCompare(b.schema)
        }),
      }
    },
  })
}

export function useDatabaseContext(...params: Parameters<typeof databaseContextQuery>) {
  return useQuery(databaseContextQuery(...params))
}
