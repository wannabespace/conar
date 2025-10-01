import type { databases } from '~/drizzle'
import { useMemo } from 'react'
import { useDatabaseTableColumns, useDatabaseTableConstraints } from '~/entities/database'
import { useDatabaseForeignKeys } from '~/entities/database/queries/foreign-keys'

export function useTableColumns({ database, table, schema }: { database: typeof databases.$inferSelect, table: string, schema: string }) {
  const { data: columns } = useDatabaseTableColumns({ database, table, schema })
  const { data: constraints } = useDatabaseTableConstraints({ database, table, schema })
  const { data: foreignKeys } = useDatabaseForeignKeys({ database })

  return useMemo(() => {
    return columns
      ?.map((column) => {
        const columnConstraints = constraints?.filter(constraint => constraint.column === column.id)
        const foreign = foreignKeys?.find(foreignKey => foreignKey.column === column.id && foreignKey.schema === schema && foreignKey.table === table)

        return {
          ...column,
          primaryKey: columnConstraints?.find(constraint => constraint.type === 'primaryKey')?.name,
          unique: columnConstraints?.find(constraint => constraint.type === 'unique')?.name,
          foreign: foreign
            ? {
                name: foreign.name,
                schema: foreign.foreignSchema,
                table: foreign.foreignTable,
                column: foreign.foreignColumn,
              }
            : undefined,
          references: foreignKeys
            ?.filter(fk => fk.foreignColumn === column.id && fk.foreignSchema === schema && fk.foreignTable === table)
            .map(fk => ({
              name: fk.name,
              schema: fk.schema,
              table: fk.table,
              column: fk.column,
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
  }, [columns, constraints, foreignKeys, schema, table])
}
