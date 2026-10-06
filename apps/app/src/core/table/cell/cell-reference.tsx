import { EQUAL_FILTER } from '@tamery/shared/filters'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@tamery/ui/components/command'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useDeferredValue, useRef, useState } from 'react'

import {
  resourceRowsQueryInfiniteOptions,
  resourceRowsQueryKey,
} from '~/core/queries/rows/list'
import { searchRowsQuery } from '~/core/queries/rows/search'
import { resourceTableColumnsQueryOptions } from '~/core/queries/tables/columns'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import type { ValueTransformer } from '~/core/transformers/value-transformer'
import { getDisplayValue } from '~/core/transformers/value-transformer'

import type { GridCursor } from '../grid-cursor'
import type { CellEdit } from './cursor'
import { PREVIEW_CHARS, rowPreview } from './row-label'
import type { Column } from './utils'
import { isTextType } from './utils'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const SUGGESTIONS = 50
const LOADING_ROWS = 4

type Row = Record<string, unknown>

/** cmdk highlights the first item, so the current value leads an untouched edit and Enter keeps it. */
const leadWithCurrent = ({
  fetched,
  key,
  raw,
  rows,
  value,
}: {
  fetched: Row | undefined
  key: string
  raw: (value: unknown) => string
  rows: Row[]
  value: unknown
}): Row[] => {
  if (value === null) {
    return rows
  }
  const isCurrent = (row: Row) => raw(row[key]) === raw(value)
  return [
    rows.find(isCurrent) ?? fetched ?? { [key]: value },
    ...rows.filter((row) => !isCurrent(row)),
  ]
}

const OptionLabel = ({
  keyColumn,
  loading,
  row,
}: {
  keyColumn: string
  loading: boolean
  row: Row
}) => {
  const details = rowPreview(row, keyColumn)
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span data-mask className="truncate tabular-nums">
        {getDisplayValue(row[keyColumn], PREVIEW_CHARS)}
      </span>
      {details ? (
        <span data-mask className="text-muted-foreground text-2xs truncate">
          {details}
        </span>
      ) : (
        loading && <Skeleton className="my-0.5 h-2.5 w-40" />
      )}
    </span>
  )
}

const LoadingRows = () => (
  <div aria-hidden className="flex flex-col gap-3 px-3 py-2">
    {Array.from({ length: LOADING_ROWS }, (_, index) => (
      // oxlint-disable-next-line react/no-array-index-key -- static placeholders
      <div key={index} className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-2.5 w-40" />
      </div>
    ))}
  </div>
)

export const CellReference = ({
  column,
  cursor,
  edit,
  foreign,
  transformer,
  value,
}: {
  column: Column
  cursor: GridCursor
  edit: CellEdit | null
  foreign: NonNullable<Column['foreign']>
  transformer: ValueTransformer
  value: unknown
}) => {
  const { connectionResource } = useRouteContext()
  const ref = useRef<HTMLInputElement>(null)
  const [highlighted, setHighlighted] = useState('')
  const raw = (rowValue: unknown) =>
    rowValue === null ? '' : transformer.fromConnection(rowValue).toRaw()
  const text = edit?.text ?? ''
  const untouched = text === raw(value)
  const term = useDeferredValue(untouched ? '' : text)

  const { data: columns, isPending: isColumnsPending } = useQuery(
    resourceTableColumnsQueryOptions({ connectionResource, ...foreign })
  )
  const searched = [
    foreign.column,
    ...(columns ?? []).flatMap((candidate) =>
      candidate.id !== foreign.column && isTextType(candidate.type)
        ? [candidate.id]
        : []
    ),
  ]

  // An untouched edit searches nothing, so it needn't wait for the column list.
  const browsing = term === ''
  const searchedColumns = browsing ? [] : searched
  const { data: rows = [], isPending } = useQuery({
    enabled: browsing || !isColumnsPending,
    queryFn: async () =>
      searchRowsQuery({
        columns: searchedColumns,
        limit: SUGGESTIONS,
        schema: foreign.schema,
        table: foreign.table,
        term,
      }).run(await connectionResourceToQueryParams(connectionResource)),
    queryKey: [
      ...resourceRowsQueryKey({ connectionResource, ...foreign }),
      'search',
      searchedColumns,
      term,
    ],
  })
  // Same key as the ↗ peek's rows hop, so hovering that button already loaded it.
  const { data: [currentRow] = [], isLoading: isCurrentLoading } =
    useInfiniteQuery({
      ...resourceRowsQueryInfiniteOptions({
        connectionResource,
        query: {
          filters: [
            { column: foreign.column, ref: EQUAL_FILTER, values: [value] },
          ],
          orderBy: {},
        },
        schema: foreign.schema,
        table: foreign.table,
      }),
      enabled: value !== null && value !== undefined,
    })

  const options = untouched
    ? leadWithCurrent({
        fetched: currentRow,
        key: foreign.column,
        raw,
        rows,
        value,
      })
    : rows
  const keys = options.map((row) => raw(row[foreign.column]))

  useHotkeys(
    [
      {
        callback: () => cursor.leave(0, 0),
        hotkey: 'Enter',
        options: { enabled: options.length === 0 },
      },
      { callback: () => cursor.leave(0, 1), hotkey: 'Tab' },
      { callback: () => cursor.leave(0, -1), hotkey: 'Shift+Tab' },
    ],
    { ignoreInputs: false, target: ref }
  )

  const pick = (picked: unknown) => {
    cursor.change(raw(picked))
    cursor.leave(0, 0)
  }

  return (
    <Command
      size="sm"
      variant="transparent"
      shouldFilter={false}
      loop
      // cmdk drops its highlight when the highlighted item unmounts beside others (new results), leaving Enter dead.
      value={keys.includes(highlighted) ? highlighted : (keys[0] ?? '')}
      onValueChange={setHighlighted}
      aria-label={`Value of ${column.id}`}
    >
      <CommandInput
        ref={ref}
        data-mask
        variant="flat"
        autoFocus
        onFocus={({ currentTarget }) => currentTarget.select()}
        placeholder={edit?.text === null ? 'null' : `Search ${foreign.table}…`}
        value={text}
        onValueChange={(next) => cursor.change(next)}
      />
      <CommandList>
        <CommandEmpty>
          {isPending ? 'Searching…' : `No matching ${foreign.table} rows`}
        </CommandEmpty>
        <CommandGroup>
          {options.map((row) => {
            const key = raw(row[foreign.column])
            return (
              <CommandItem
                key={key}
                value={key}
                data-checked={value !== null && key === raw(value)}
                onSelect={() => pick(row[foreign.column])}
              >
                <OptionLabel
                  keyColumn={foreign.column}
                  loading={isPending || isCurrentLoading}
                  row={row}
                />
              </CommandItem>
            )
          })}
        </CommandGroup>
        {isPending && options.length > 0 && <LoadingRows />}
      </CommandList>
    </Command>
  )
}
