import type { databases } from '~/drizzle'
import { useMemo } from 'react'
import { useDatabaseConstraints, useDatabaseTableColumns } from '~/entities/database'

export function useTableColumns({ database, table, schema }: { database: typeof databases.$inferSelect, table: string, schema: string }) {
  const { data: columns } = useDatabaseTableColumns({ database, table, schema })
  const { data: constraints } = useDatabaseConstraints({ database })

  return useMemo(() => {
    return columns
      ?.map((column) => {
        const columnConstraints = constraints?.filter(c => c.column === column.id)
        const foreignConstraint = columnConstraints?.find(c => c.type === 'foreignKey' && c.schema === schema && c.table === table)
        const uniqueConstraint = columnConstraints?.find(c => c.type === 'unique')
        const primaryConstraint = columnConstraints?.find(c => c.type === 'primaryKey')

        return {
          ...column,
          primaryKey: primaryConstraint?.name,
          unique: uniqueConstraint?.name,
          foreign: foreignConstraint && foreignConstraint.usageSchema && foreignConstraint.usageTable && foreignConstraint.usageColumn
            ? {
                name: foreignConstraint.name,
                schema: foreignConstraint.usageSchema,
                table: foreignConstraint.usageTable,
                column: foreignConstraint.usageColumn,
              }
            : undefined,
          references: constraints
            ?.filter(c => c.type === 'foreignKey'
              && c.usageColumn === column.id
              && c.usageSchema === schema
              && c.usageTable === table
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
      }) ?? []
  }, [columns, constraints, schema, table])
}
