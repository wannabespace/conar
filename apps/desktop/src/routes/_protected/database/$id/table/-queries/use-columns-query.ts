import type { connections } from '~/drizzle'
import { useQueries } from '@tanstack/react-query'
import { connectionConstraintsQuery, connectionTableColumnsQuery } from '~/entities/connection/queries'

export function useTableColumns({ connection, table, schema }: { connection: typeof connections.$inferSelect, table: string, schema: string }) {
  const [columns, constraints] = useQueries({
    queries: [
      connectionTableColumnsQuery({ connection, table, schema }),
      connectionConstraintsQuery({ connection }),
    ],
    combine: ([columns, constraints]) => [columns.data ?? [], constraints.data ?? []],
  })

  return columns
    .map((column) => {
      const columnConstraints = constraints.filter(c => c.column === column.id && c.schema === schema && c.table === table)
      const foreignConstraint = columnConstraints.find(c => c.type === 'foreignKey')
      const uniqueConstraint = columnConstraints.find(c => c.type === 'unique')
      const primaryConstraint = columnConstraints.find(c => c.type === 'primaryKey')

      return {
        ...column,
        primaryKey: primaryConstraint?.name,
        unique: uniqueConstraint?.name,
        foreign: foreignConstraint && foreignConstraint.foreignSchema && foreignConstraint.foreignTable && foreignConstraint.foreignColumn
          ? {
              name: foreignConstraint.name,
              schema: foreignConstraint.foreignSchema,
              table: foreignConstraint.foreignTable,
              column: foreignConstraint.foreignColumn,
            }
          : undefined,
        references: constraints
          .filter(c => c.type === 'foreignKey'
            && c.foreignColumn === column.id
            && c.foreignSchema === schema
            && c.foreignTable === table
            && !!c.column,
          )
          .map(c => ({
            name: c.name,
            schema: c.schema,
            table: c.table,
            column: c.column!,
          })),
      }
    })
    .toSorted((a, b) => {
      if (a.primaryKey && !b.primaryKey)
        return -1
      if (!a.primaryKey && b.primaryKey)
        return 1
      return 0
    })
}
