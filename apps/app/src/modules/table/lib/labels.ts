import { IN_FILTER } from '@tamery/shared/filters'
import type { GridRow } from '@tamery/table'
import { useQueries } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { resourceRowsQueryKey } from '~/core/queries/rows/list'
import { selectQuery } from '~/core/queries/rows/select'
import { resourceTableColumnsQueryOptions } from '~/core/queries/tables/columns'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import type { Column } from '~/core/table/cell/utils'
import { isTextType } from '~/core/table/cell/utils'
import { getDisplayValue } from '~/core/transformers/value-transformer'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const keysIn = (rows: GridRow[], column: string) =>
  [
    ...new Set(
      rows.flatMap((row) => {
        const value = row[column]
        return value === null || value === undefined ? [] : [String(value)]
      })
    ),
  ].toSorted()

const byColumn = (
  results: { data?: readonly [string, Map<string, string>] }[]
) => new Map(results.flatMap(({ data }) => (data ? [data] : [])))

const LABEL_CHARS = 60
const LABEL_NAMES_BY_PREFERENCE = [
  'name',
  'title',
  'label',
  'display_name',
  'full_name',
  'username',
  'email',
  'slug',
  'role',
]

const defaultLabel = (columns: { id: string; type: string }[], key: string) =>
  LABEL_NAMES_BY_PREFERENCE.map((name) =>
    columns.find(
      (column) =>
        column.id !== key &&
        column.id.toLowerCase() === name &&
        isTextType(column.type)
    )
  ).find(Boolean)?.id

export const labelColumnOf = (
  stored: string | undefined,
  columns: { id: string; type: string }[],
  key: string
) => (stored === undefined ? defaultLabel(columns, key) : stored || undefined)

export const useReferenceLabels = (
  columns: Column[],
  rows: GridRow[],
  stored: Record<string, string>
) => {
  const { connectionResource } = useRouteContext()
  const foreignColumns = columns.flatMap(({ foreign, id }) =>
    foreign && stored[id] !== '' ? [{ foreign, id }] : []
  )
  const referenced = useQueries({
    queries: foreignColumns.map(({ foreign }) =>
      resourceTableColumnsQueryOptions({
        connectionResource,
        schema: foreign.schema,
        table: foreign.table,
      })
    ),
  })
  const labeled = foreignColumns.flatMap(({ foreign, id }, index) => {
    const label = labelColumnOf(
      stored[id],
      referenced[index]?.data ?? [],
      foreign.column
    )
    return label ? [{ foreign, id, label }] : []
  })

  return useQueries({
    combine: byColumn,
    queries: labeled.map(({ foreign, id, label }) => {
      const keys = keysIn(rows, id)
      return {
        enabled: keys.length > 0,
        queryFn: async () => {
          const found = await selectQuery({
            filters: [{ column: foreign.column, ref: IN_FILTER, values: keys }],
            schema: foreign.schema,
            select: [foreign.column, label],
            table: foreign.table,
          }).run(await connectionResourceToQueryParams(connectionResource))
          return [
            id,
            new Map(
              found.flatMap((row) => {
                const text = row[label]
                return text === null || text === undefined || text === ''
                  ? []
                  : [
                      [
                        String(row[foreign.column]),
                        getDisplayValue(text, LABEL_CHARS),
                      ] as const,
                    ]
              })
            ),
          ] as const
        },
        queryKey: [
          ...resourceRowsQueryKey({
            connectionResource,
            schema: foreign.schema,
            table: foreign.table,
          }),
          'labels',
          id,
          foreign.column,
          label,
          keys,
        ],
      }
    }),
  })
}
