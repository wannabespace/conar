import { useQueries } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { resourceTableColumnsQueryOptions } from '~/core/queries/tables/columns'

import type { Column } from './cell/utils'
import { isTextType } from './cell/utils'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const labelCandidates = <T extends { id: string; type: string }>(
  columns: T[],
  key: string
) => columns.filter((column) => column.id !== key && isTextType(column.type))

/** Keyed by the foreign-key column's id; a column is missing until its referenced table's columns load. */
export const useReferencedColumns = (columns: Column[]) => {
  const { connectionResource } = useRouteContext()
  const foreignKeys = columns.flatMap(({ foreign, id }) =>
    foreign ? [{ foreign, id }] : []
  )

  return useQueries({
    combine: (results) =>
      new Map(
        foreignKeys.flatMap(({ id }, index) => {
          const data = results[index]?.data
          return data ? [[id, data] as const] : []
        })
      ),
    queries: foreignKeys.map(({ foreign }) =>
      resourceTableColumnsQueryOptions({
        connectionResource,
        schema: foreign.schema,
        table: foreign.table,
      })
    ),
  })
}
