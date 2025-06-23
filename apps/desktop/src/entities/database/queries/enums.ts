import { useQuery } from '@tanstack/react-query'
import { databaseContextQuery } from './context'

export function useDatabaseEnums(...params: Parameters<typeof databaseContextQuery>) {
  return useQuery({
    ...databaseContextQuery(...params),
    select: (data) => {
      const groupedEnums = data.enums.reduce((acc, { schema, name, value }) => {
        const key = `${schema}.${name}`

        if (!acc[key]) {
          acc[key] = { schema, name, values: [] }
        }

        acc[key].values.push(value)

        return acc
      }, {} as Record<string, { schema: string, name: string, values: string[] }>)

      return Object.values(groupedEnums)
    },
  })
}
