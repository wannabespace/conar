import type { databases } from '~/drizzle'
import { useMemo } from 'react'
import { useDatabaseTableColumns, useDatabaseTableConstraints } from '~/entities/database'

export function useTableColumns({ database, table, schema }: { database: typeof databases.$inferSelect, table: string, schema: string }) {
  const { data: columns } = useDatabaseTableColumns({ database, table, schema })
  const { data: constraints } = useDatabaseTableConstraints({ database, table, schema })

  return useMemo(() => {
    return columns
      ?.map((column) => {
        const columnConstraints = constraints?.filter(constraint => constraint.column === column.id)
        const foreign = columnConstraints?.find(constraint => constraint.type === 'foreignKey')

        return {
          ...column,
          primaryKey: columnConstraints?.find(constraint => constraint.type === 'primaryKey')?.name,
          unique: columnConstraints?.find(constraint => constraint.type === 'unique')?.name,
          foreign: foreign && foreign.type === 'foreignKey' && foreign.foreignTable && foreign.foreignColumn
            ? {
                name: foreign.name,
                table: foreign.foreignTable,
                column: foreign.foreignColumn,
              }
            : undefined,
        }
      })
      .toSorted((a, b) => {
        if (a.primaryKey && !b.primaryKey)
          return -1
        if (!a.primaryKey && b.primaryKey)
          return 1
        return 0
      }) ?? []
  }, [columns, constraints])
}
