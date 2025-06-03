import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { tableAndSchemaType, tablesAndSchemasSql } from '../sql/tables-and-schemas'

export function databaseTablesAndSchemasQuery(database: Database) {
  return queryOptions({
    queryKey: ['database', database.id, 'tables-and-schemas'],
    queryFn: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: tablesAndSchemasSql()[database.type],
      })

      return result.rows.map(row => tableAndSchemaType.assert(row))
    },
    select: (data) => {
      const schemas = new Map<string, string[]>()

      for (const { schema, name } of data) {
        const tables = schemas.get(schema) ?? []
        tables.push(name)
        schemas.set(schema, tables)
      }

      const schemasArray = Array.from(schemas.entries())
        .map(([name, tables]) => ({
          name,
          tables,
        }))
        .sort((a, b) => {
          if (a.name === 'public')
            return -1
          if (b.name === 'public')
            return 1
          return a.name.localeCompare(b.name)
        })

      return {
        totalSchemas: schemasArray.length,
        totalTables: data.length,
        schemas: schemasArray,
      }
    },
  })
}

export function useDatabaseTablesAndSchemas(...params: Parameters<typeof databaseTablesAndSchemasQuery>) {
  return useQuery(databaseTablesAndSchemasQuery(...params))
}
