import type { TableDraft } from '../../-store'
import type { connectionsResources } from '~/drizzle/schema'
import { SQL_FILTERS_LIST } from '@conar/shared/filters'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { KbdCtrlLetter } from '@conar/ui/components/custom/shortcuts'
import { Separator } from '@conar/ui/components/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@conar/ui/components/tooltip'
import { RiAlertLine, RiCloseLine, RiSaveLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'
import { resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries'
import { selectQuery } from '~/entities/connection/queries/select'
import { setQuery } from '~/entities/connection/queries/set'
import { connectionResourceToQueryParams } from '~/entities/connection/query'
import { useSaveHotkey } from '~/hooks/use-save-hotkey'
import { queryClient } from '~/main'
import { draftsActions, useTablePageStore } from '../../-store'

type RowsQueryKey = ReturnType<typeof resourceRowsQueryInfiniteOptions>['queryKey']

async function saveRowToDb({
  row,
  schema,
  table,
  connectionResource,
}: {
  row: {
    data: Record<string, unknown>
    index: number
    drafts: TableDraft[]
    primaryColumns: string[]
  }
  schema: string
  table: string
  connectionResource: typeof connectionsResources.$inferSelect
}) {
  const sqlFilters = row.primaryColumns.map(column => ({
    column,
    ref: SQL_FILTERS_LIST.find(f => f.operator === '=')!,
    values: [row.data[column]],
  }))

  const values = row.drafts.reduce<Record<string, unknown>>((acc, d) => {
    acc[d.columnId] = d.value
    return acc
  }, {})

  await setQuery({
    schema,
    table,
    values,
    filters: sqlFilters,
  }).run(connectionResourceToQueryParams(connectionResource))

  const modifiedColumns = Object.keys(values)
  const updatedFilters = sqlFilters.map(filter => modifiedColumns.includes(filter.column)
    ? { ...filter, values: [values[filter.column]] }
    : filter)

  let refreshedValues: Record<string, unknown> | undefined
  try {
    const [result] = await selectQuery({
      schema,
      table,
      select: modifiedColumns,
      filters: updatedFilters,
    }).run(connectionResourceToQueryParams(connectionResource))

    if (result)
      refreshedValues = result
  }
  catch (e) {
    toast.warning('Row was saved, but the updated value could not be refreshed', {
      id: `refresh-row-error-${row.index}`,
      description: e instanceof Error ? e.message : String(e),
      duration: 4000,
    })
  }

  return { rowIndex: row.index, values, refreshedValues }
}

function applySavedValuesToCache(
  queryKey: RowsQueryKey,
  savedValuesByRow: Map<number, Record<string, unknown>>,
) {
  queryClient.setQueryData(queryKey, (data) => {
    if (!data)
      return data

    const pageOffsets = data.pages.map((_, pageIndex) =>
      data.pages.slice(0, pageIndex).reduce((sum, page) => sum + page.rows.length, 0))

    return {
      ...data,
      pages: data.pages.map((page, pageIndex) => ({
        ...page,
        rows: page.rows.map((row, rIndex) => {
          const absoluteIndex = pageOffsets[pageIndex]! + rIndex
          const savedValues = savedValuesByRow.get(absoluteIndex)
          if (!savedValues)
            return row
          return { ...row, ...savedValues }
        }),
      })),
    }
  })
}

export function DraftsToolbar({
  connectionResource,
  table,
  schema,
  primaryColumns,
}: {
  connectionResource: typeof connectionsResources.$inferSelect
  table: string
  schema: string
  primaryColumns: string[]
}) {
  const store = useTablePageStore()
  const { drafts, rowsWithDrafts } = useSubscription(store, {
    selector: state => ({
      drafts: state.drafts,
      rowsWithDrafts: state.drafts.reduce<Map<number, typeof state.drafts>>((acc, draft) => {
        const list = acc.get(draft.rowIndex) ?? []
        list.push(draft)
        acc.set(draft.rowIndex, list)
        return acc
      }, new Map()),
    }),
  })
  const { clear, removeRow, setRowStatus } = draftsActions(store)

  const errorCount = drafts.filter(d => !!d.error).length
  const totalCount = drafts.length
  const rowCount = rowsWithDrafts.size

  const handleDiscard = () => {
    clear()
  }

  const { mutate: saveDrafts, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (primaryColumns.length === 0)
        throw new Error('No primary keys found. Please use SQL Runner to update rows.')

      const { filters, orderBy } = store.get()
      const rowsQueryOpts = resourceRowsQueryInfiniteOptions({
        connectionResource,
        table,
        schema,
        query: { filters, orderBy },
      })

      const cachedData = queryClient.getQueryData(rowsQueryOpts.queryKey)

      if (!cachedData)
        throw new Error('No data found. Please refresh the page.')

      const allRows = cachedData.pages.flatMap(page => page.rows)
      const rowEntries = Array.from(rowsWithDrafts.entries())

      for (const [rowIndex] of rowEntries) {
        setRowStatus(rowIndex, { isCommitting: true, error: undefined })
      }

      const results = await Promise.allSettled(
        rowEntries.map(([rowIndex, rowDrafts]) => {
          const row = allRows[rowIndex]
          if (!row)
            throw new Error('Row not found in cache. Please refresh the page.')

          return saveRowToDb({
            row: {
              data: row,
              index: rowIndex,
              drafts: rowDrafts,
              primaryColumns,
            },
            schema,
            table,
            connectionResource,
          })
        }),
      )

      return { results, rowEntries, rowsQueryOpts, filters, orderBy }
    },
    onSuccess: ({ results, rowEntries, rowsQueryOpts, filters, orderBy }) => {
      const savedValuesByRow = new Map<number, Record<string, unknown>>()
      let hadError = false

      results.forEach((result, idx) => {
        const [rowIndex] = rowEntries[idx]!

        if (result.status === 'fulfilled') {
          savedValuesByRow.set(rowIndex, result.value.refreshedValues ?? result.value.values)
          return
        }

        hadError = true
        const message = result.reason instanceof Error ? result.reason.message : String(result.reason)
        setRowStatus(rowIndex, {
          isCommitting: false,
          error: message,
        })
        toast.error(`Failed to save row`, {
          id: `save-row-error-${rowIndex}-${message}`,
          description: message,
          duration: 4000,
        })
      })

      if (savedValuesByRow.size > 0) {
        applySavedValuesToCache(rowsQueryOpts.queryKey, savedValuesByRow)

        for (const rowIndex of savedValuesByRow.keys()) {
          removeRow(rowIndex)
        }

        if (filters.length > 0 || Object.keys(orderBy).length > 0)
          queryClient.invalidateQueries({ queryKey: rowsQueryOpts.queryKey.slice(0, -1) })
      }

      if (savedValuesByRow.size > 0) {
        toast[hadError ? 'warning' : 'success'](
          hadError
            ? `Saved ${savedValuesByRow.size} row${savedValuesByRow.size === 1 ? '' : 's'}, ${results.length - savedValuesByRow.size} failed`
            : `Saved ${savedValuesByRow.size} row${savedValuesByRow.size === 1 ? '' : 's'}`,
        )
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSave = () => {
    saveDrafts()
  }

  useSaveHotkey(handleSave, totalCount === 0 || isSaving)

  return (
    <AnimatePresence initial={false}>
      {drafts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.3, type: 'spring' }}
          className="
            pointer-events-auto absolute inset-x-0 bottom-3 z-20 mx-auto flex
            w-fit items-center gap-2 rounded-lg border bg-card py-1.5 pr-1.5
            pl-3 text-card-foreground shadow-lg backdrop-blur-sm
            dark:bg-input/32
          "
        >
          <div className="flex items-center gap-2 text-xs">
            {errorCount > 0 && (
              <>
                <span className="flex items-center gap-1 text-destructive">
                  <RiAlertLine className="size-3.5" />
                  <span className="font-medium">
                    {errorCount}
                    {' '}
                    failed
                  </span>
                </span>
                <span className="text-muted-foreground">·</span>
              </>
            )}
            <span>
              <span className="font-medium">
                {totalCount}
              </span>
              {' '}
              unsaved change
              {totalCount === 1 ? '' : 's'}
              {' '}
              in
              {' '}
              <span className="font-medium">
                {rowCount}
              </span>
              {' '}
              row
              {rowCount === 1 ? '' : 's'}
            </span>
          </div>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleDiscard}
                disabled={isSaving}
              >
                <RiCloseLine className="size-3.5" />
                Discard
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Discard all unsaved changes</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="xs"
                onClick={handleSave}
                disabled={isSaving}
              >
                <LoadingContent loading={isSaving}>
                  <RiSaveLine className="size-3.5" />
                  {errorCount > 0 ? 'Retry save' : 'Save all'}
                  <KbdCtrlLetter
                    userAgent={navigator.userAgent}
                    letter="S"
                    className="text-white"
                  />
                </LoadingContent>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Save all unsaved changes</TooltipContent>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
