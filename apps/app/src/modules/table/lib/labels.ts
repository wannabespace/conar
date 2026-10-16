import { IN_FILTER } from '@tamery/shared/filters'
import type { GridRow } from '@tamery/table'
import { useQueries } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import type { ConnectionResource } from '~/core/connection/sync'
import { resourceConstraintsQueryOptions } from '~/core/queries/constraints/list'
import type { RowsQueryProps } from '~/core/queries/rows/list'
import {
  resourceRowsQuery,
  resourceRowsQueryKey,
} from '~/core/queries/rows/list'
import { resourceTableColumnsQueryOptions } from '~/core/queries/tables/columns'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import type { Column } from '~/core/table/cell/utils'
import {
  labelCandidates,
  useReferencedColumns,
} from '~/core/table/referenced-columns'
import { getDisplayValue } from '~/core/transformers/value-transformer'
import { queryClient } from '~/lib/query-client'

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

export const getLabelColumn = (
  stored: string | undefined,
  columns: { id: string; type: string }[],
  key: string
) => (stored === undefined ? defaultLabel(columns, key) : stored || undefined)

const referenceLabelsQueryOptions = ({
  connectionResource,
  foreign,
  id,
  keys,
  label,
  referenced,
}: {
  connectionResource: ConnectionResource
  foreign: Pick<NonNullable<Column['foreign']>, 'column' | 'schema' | 'table'>
  id: string
  keys: string[]
  label: string
  referenced: RowsQueryProps['columns']
}) => ({
  queryFn: async () => {
    const found = await resourceRowsQuery({
      columns: referenced,
      limit: keys.length,
      offset: 0,
      query: {
        filters: [{ column: foreign.column, ref: IN_FILTER, values: keys }],
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
})

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
    const label = getLabelColumn(
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
        ...referenceLabelsQueryOptions({
          connectionResource,
          foreign,
          id,
          keys,
          label,
          referenced: referenced.get(id),
        }),
        enabled: keys.length > 0,
      }
    }),
  })
}

export const prefetchReferenceLabels = async ({
  connectionResource,
  hidden,
  rows,
  schema,
  stored,
  table,
}: {
  connectionResource: ConnectionResource
  hidden: string[]
  rows: GridRow[]
  schema: string
  stored: Record<string, string>
  table: string
}) => {
  const constraints = await queryClient.query(
    resourceConstraintsQueryOptions({ connectionResource })
  )
  const foreignKeys = constraints.flatMap((constraint) => {
    const { column, foreignColumn, foreignSchema, foreignTable } = constraint
    return constraint.type === 'foreignKey' &&
      constraint.schema === schema &&
      constraint.table === table &&
      column &&
      !hidden.includes(column) &&
      foreignColumn &&
      foreignSchema &&
      foreignTable
      ? [
          {
            foreign: {
              column: foreignColumn,
              schema: foreignSchema,
              table: foreignTable,
            },
            id: column,
          },
        ]
      : []
  })

  await Promise.all(
    foreignKeys.map(async ({ foreign, id }) => {
      const keys = keysIn(rows, id)
      if (keys.length === 0) {
        return
      }
      const referenced = await queryClient.query(
        resourceTableColumnsQueryOptions({
          connectionResource,
          schema: foreign.schema,
          table: foreign.table,
        })
      )
      const label = getLabelColumn(stored[id], referenced, foreign.column)
      if (label) {
        await queryClient.query(
          referenceLabelsQueryOptions({
            connectionResource,
            foreign,
            id,
            keys,
            label,
            referenced,
          })
        )
      }
    })
  )
}
