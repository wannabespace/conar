import type { connectionsResources } from '~/drizzle/schema'
import type { Column } from '~/entities/connection/components/table/cell'
import { useQueries } from '@tanstack/react-query'
import { createContext, use } from 'react'
import { getColumnUiType } from '~/entities/connection/components/table/cell'
import { findEnum, resourceConstraintsQueryOptions, resourceEnumsQueryOptions, resourceTableColumnsQueryOptions } from '~/entities/connection/queries'

export function useTableColumnsQuery({ connectionResource, table, schema }: { connectionResource: typeof connectionsResources.$inferSelect, table: string, schema: string }) {
  return useQueries({
    queries: [
      resourceTableColumnsQueryOptions({ connectionResource, table, schema }),
      resourceConstraintsQueryOptions({ connectionResource }),
      resourceEnumsQueryOptions({ connectionResource }),
    ],
    combine: ([columns, constraints, enums]): { data?: Column[], isPending: boolean, error: Error | null } => {
      if (columns.isPending || constraints.isPending || enums.isPending) {
        return {
          data: [],
          isPending: true,
          error: null,
        }
      }

      const constraintsData = constraints.data || []
      const data = columns.data?.map((column): Column => {
        const columnConstraints = constraintsData.filter(c => c.column === column.id && c.schema === schema && c.table === table)
        const foreignConstraint = columnConstraints.find(c => c.type === 'foreignKey')
        const uniqueConstraint = columnConstraints.find(c => c.type === 'unique')
        const primaryConstraint = columnConstraints.find(c => c.type === 'primaryKey')

        return {
          ...column,
          uiType: getColumnUiType(column),
          availableValues: column.enumName && enums.data
            ? findEnum({
              enums: enums.data,
              column,
              table,
            })?.values
            : undefined,
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
        } satisfies Column
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
