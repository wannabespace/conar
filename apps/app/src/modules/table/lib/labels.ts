import { IN_FILTER } from '@tamery/shared/filters'
import type { GridRow } from '@tamery/table'
import { useQueries } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import {
  resourceRowsQuery,
  resourceRowsQueryKey,
} from '~/core/queries/rows/list'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import type { Column } from '~/core/table/cell/utils'
import {
  labelCandidates,
  useReferencedColumns,
} from '~/core/table/referenced-columns'
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
  'displayname',
  'fullname',
  'username',
  'nickname',
  'login',
  'handle',
  'email',
  'firstname',
  'lastname',
  'subject',
  'heading',
  'caption',
  'slug',
  'code',
  'sku',
  'role',
  'description',
]

const comparable = (column: string) =>
  column.toLowerCase().replaceAll(/[\s_-]/gu, '')

const defaultLabel = (columns: { id: string; type: string }[], key: string) => {
  const candidates = labelCandidates(columns, key)
  return LABEL_NAMES_BY_PREFERENCE.map((name) =>
    candidates.find((column) => comparable(column.id) === name)
  ).find(Boolean)?.id
}

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
  const referenced = useReferencedColumns(columns)
  const labeled = columns.flatMap(({ foreign, id }) => {
    if (!foreign) {
      return []
    }
    const label = labelColumnOf(
      stored[id],
      referenced.get(id) ?? [],
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
          const found = await resourceRowsQuery({
            columns: referenced.get(id),
            limit: keys.length,
            offset: 0,
            query: {
              filters: [
                { column: foreign.column, ref: IN_FILTER, values: keys },
              ],
            },
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
