import type { connectionsResources } from '~/drizzle/schema'
import type { Column } from '~/entities/connection/components/table/cell'
import { useQueries } from '@tanstack/react-query'
import { createContext, use } from 'react'
import { getColumnUiType } from '~/entities/connection/components/table/cell'
import { resourceConstraintsQueryOptions, resourceTableColumnsQueryOptions } from '~/entities/connection/queries'

export function useTableColumnsQuery({ connectionResource, table, schema }: { connectionResource: typeof connectionsResources.$inferSelect, table: string, schema: string }) {
  return useQueries({
    queries: [
      resourceTableColumnsQueryOptions({ connectionResource, table, schema }),
      resourceConstraintsQueryOptions({ connectionResource }),
    ],
    combine: ([columns, constraints]) => {
      const constraintsData = constraints.data || []
      const data = columns.data?.map((column) => {
        const columnConstraints = constraintsData.filter(c => c.column === column.id && c.schema === schema && c.table === table)
        const foreignConstraint = columnConstraints.find(c => c.type === 'foreignKey')
        const uniqueConstraint = columnConstraints.find(c => c.type === 'unique')
        const primaryConstraint = columnConstraints.find(c => c.type === 'primaryKey')

        return {
          ...column,
          uiType: getColumnUiType(column),
          primaryKey: primaryConstraint?.name,
          defaultValue: column.default,
          unique: uniqueConstraint?.name,
          foreign: foreignConstraint && foreignConstraint.foreignSchema && foreignConstraint.foreignTable && foreignConstraint.foreignColumn
            ? {
                name: foreignConstraint.name,
                schema: foreignConstraint.foreignSchema,
                table: foreignConstraint.foreignTable,
                column: foreignConstraint.foreignColumn,
                onDelete: foreignConstraint.onDelete ?? undefined,
                onUpdate: foreignConstraint.onUpdate ?? undefined,
              }
            : undefined,
          references: constraintsData
            .filter(c => c.type === 'foreignKey'
              && c.foreignColumn === column.id
              && c.foreignSchema === schema
              && c.foreignTable === table
              && !!c.column,
            )
            .map((c) => {
              const isUnique = constraintsData.some(u =>
                (u.type === 'unique' || u.type === 'primaryKey')
                && u.schema === c.schema
                && u.table === c.table
                && u.column === c.column,
              )

              return {
                name: c.name,
                schema: c.schema,
                table: c.table,
                column: c.column!,
                isUnique,
              }
            }),
        }
      })
        .toSorted((a, b) => {
          if (a.primaryKey && !b.primaryKey)
            return -1
          if (!a.primaryKey && b.primaryKey)
            return 1
          return 0
        })

      return {
        data,
        isPending: columns.isPending || constraints.isPending,
        error: columns.error || constraints.error,
      }
    },
  })
}

export const ColumnsContext = createContext<Column[]>(null!)

export function useTableColumns() {
  return use(ColumnsContext)
}
