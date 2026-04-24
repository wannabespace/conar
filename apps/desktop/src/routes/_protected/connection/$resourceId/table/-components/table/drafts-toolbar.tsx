import type { Kysely } from 'kysely'
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
import { RiAlertLine, RiEyeLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'
import { dialects } from '~/entities/connection/dialects'
import { resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries'
import { buildWhere } from '~/entities/connection/queries/rows'
import { connectionResourceToQueryParams } from '~/entities/connection/query'
import { useSaveHotkey } from '~/hooks/use-save-hotkey'
import { queryClient } from '~/main'
import { Route } from '../..'
import { useTableColumns } from '../../-columns'
import { draftsActions, useTablePageStore } from '../../-store'
import { DraftsReviewDrawer } from './drafts-review-drawer'

type RowsQueryKey = ReturnType<typeof resourceRowsQueryInfiniteOptions>['queryKey']

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
  table,
  schema,
}: {
  table: string
  schema: string
}) {
  const { connectionResource } = Route.useRouteContext()
  const store = useTablePageStore()
  const columns = useTableColumns()
  const primaryColumns = columns.filter(c => c.primaryKey).map(c => c.id)
  const drafts = useSubscription(store, { selector: state => state.drafts })
  const rowsWithDrafts = drafts.reduce<Map<number, typeof drafts>>(
    (acc, draft) => {
      const list = acc.get(draft.rowIndex) ?? []
      list.push(draft)
      acc.set(draft.rowIndex, list)
      return acc
    },
    new Map(),
  )
  const { clear, removeRow, setRowStatus } = draftsActions(store)
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const errorCount = drafts.filter(d => !!d.error).length
  const totalCount = drafts.length
  const rowCount = rowsWithDrafts.size

  const handleDiscard = () => {
    clear()
    setIsReviewOpen(false)
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

      const queryParams = connectionResourceToQueryParams(connectionResource)
      const db = dialects[queryParams.type]({
        connectionString: queryParams.connectionString,
        log: queryParams.log,
        // eslint-disable-next-line ts/no-explicit-any
      }) as unknown as Kysely<any>

      let failingRowIndex: number | null = null

      try {
        const savedValuesByRow = await db.transaction().execute(async (trx) => {
          const saved = new Map<number, Record<string, unknown>>()

          for (const [rowIndex, rowDrafts] of rowEntries) {
            failingRowIndex = rowIndex

            const row = allRows[rowIndex]
            if (!row)
              throw new Error('Row not found in cache. Please refresh the page.')

            const sqlFilters = primaryColumns.map(column => ({
              column,
              ref: SQL_FILTERS_LIST.find(f => f.operator === '=')!,
              values: [row[column]],
            }))

            const values = rowDrafts.reduce<Record<string, unknown>>((acc, d) => {
              acc[d.columnId] = d.value
              return acc
            }, {})

            await trx
              .withSchema(schema)
              .withTables<{ [table]: Record<string, unknown> }>()
              .updateTable(table)
              .set(values)
              // eslint-disable-next-line ts/no-explicit-any
              .where((eb: any) => buildWhere(eb, sqlFilters))
              .execute()

            const modifiedColumns = Object.keys(values)
            const updatedFilters = sqlFilters.map(filter => modifiedColumns.includes(filter.column)
              ? { ...filter, values: [values[filter.column]] }
              : filter)

            const refreshedRows = await trx
              .withSchema(schema)
              .withTables<{ [table]: Record<string, unknown> }>()
              .selectFrom(table)
              .select(modifiedColumns)
              // eslint-disable-next-line ts/no-explicit-any
              .where((eb: any) => buildWhere(eb, updatedFilters))
              .execute()

            const refreshed = Array.isArray(refreshedRows) && refreshedRows.length > 0
              ? refreshedRows[0] as Record<string, unknown>
              : undefined

            saved.set(rowIndex, refreshed ?? values)
          }

          failingRowIndex = null
          return saved
        })

        return { status: 'success' as const, savedValuesByRow, rowEntries, rowsQueryOpts, filters, orderBy }
      }
      catch (error) {
        return { status: 'error' as const, error, failingRowIndex, rowEntries }
      }
    },
    onSuccess: (data) => {
      if (data.status === 'error') {
        const { error, failingRowIndex, rowEntries } = data

        for (const [rowIndex] of rowEntries) {
          setRowStatus(rowIndex, { isCommitting: false })
        }

        const message = error instanceof Error ? error.message : String(error)

        if (failingRowIndex !== null) {
          setRowStatus(failingRowIndex, {
            isCommitting: false,
            error: message,
          })

          toast.error('Failed to save changes', {
            id: `save-transaction-error-${failingRowIndex}-${message}`,
            description: `${message}. Transaction rolled back — no rows were saved.`,
            duration: 6000,
          })
        }
        else {
          toast.error('Failed to save changes', {
            description: `${message}. Transaction rolled back — no rows were saved.`,
            duration: 6000,
          })
        }

        return
      }

      const { savedValuesByRow, rowsQueryOpts, filters, orderBy } = data

      applySavedValuesToCache(rowsQueryOpts.queryKey, savedValuesByRow)

      for (const rowIndex of savedValuesByRow.keys()) {
        removeRow(rowIndex)
      }

      if (filters.length > 0 || Object.keys(orderBy).length > 0)
        queryClient.invalidateQueries({ queryKey: rowsQueryOpts.queryKey.slice(0, -1) })

      const count = savedValuesByRow.size
      toast.success(`Saved ${count} row${count === 1 ? '' : 's'}`)

      setIsReviewOpen(false)
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
            w-fit items-center gap-2 rounded-lg border bg-card/60 py-1.5 pr-1.5
            pl-3 text-card-foreground shadow-lg backdrop-blur-md
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
                variant="outline"
                size="icon-xs"
                onClick={() => setIsReviewOpen(true)}
                disabled={isSaving}
              >
                <RiEyeLine className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Review changes before saving</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="xs"
                onClick={handleSave}
                disabled={isSaving}
              >
                <LoadingContent loading={isSaving}>
                  {errorCount > 0 ? 'Retry' : 'Save'}
                  <KbdCtrlLetter
                    userAgent={navigator.userAgent}
                    letter="S"
                    className="text-white"
                  />
                </LoadingContent>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Save all unsaved changes atomically in a transaction</TooltipContent>
          </Tooltip>
          <DraftsReviewDrawer
            open={isReviewOpen}
            onOpenChange={setIsReviewOpen}
            table={table}
            schema={schema}
            isSaving={isSaving}
            onSave={handleSave}
            onDiscardAll={handleDiscard}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
