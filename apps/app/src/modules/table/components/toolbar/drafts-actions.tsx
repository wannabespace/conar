import { ViewIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import { EQUAL_FILTER } from '@tamery/shared/filters'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { sql } from 'kysely'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { insertRowQuery } from '~/core/queries/rows/insert-row'
import { resourceRowsQueryInfiniteOptions } from '~/core/queries/rows/list'
import { selectQuery } from '~/core/queries/rows/select'
import { setQuery } from '~/core/queries/rows/set'
import { resourceTableTotalQueryKey } from '~/core/queries/rows/total'
import {
  connectionResourceToQueryParams,
  transaction,
} from '~/core/runtime/query'
import type { PrimaryKeys } from '~/core/table/session'
import {
  draftsActions,
  getRowKeyByPrimaryKeys,
  newRowsActions,
  primaryKeysKey,
  useTableSessionStore,
} from '~/core/table/session'
import { createTransformer } from '~/core/transformers/create-transformer'
import { useSaveHotkey } from '~/hooks/use-save-hotkey'
import { queryClient } from '~/lib/query-client'

import { useTableColumnsContext } from '../../lib/columns'
import { useTablePageStore } from '../../lib/store'
import { DraftsReviewDrawer } from '../table/drafts-review-drawer'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const DraftsActions = ({
  table,
  schema,
}: {
  table: string
  schema: string
}) => {
  const { connection, connectionResource } = useRouteContext()
  const store = useTablePageStore()
  const sessionStore = useTableSessionStore()
  const { columns } = useTableColumnsContext()
  const primaryColumns = columns.filter((c) => c.primaryKey).map((c) => c.id)
  const drafts = useSubscription(sessionStore, {
    selector: (state) => Object.values(state.drafts),
  })
  const newRows = useSubscription(sessionStore, {
    selector: (state) => state.newRows,
  })
  const rowsWithDrafts = Map.groupBy(drafts, (d) =>
    primaryKeysKey(d.primaryKeys)
  )
  const { clear, removeRow, setRowStatus } = draftsActions(sessionStore)
  const newRowStatus = newRowsActions(sessionStore)
  const changeCount = drafts.length + newRows.length
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const columnsById = new Map(columns.map((column) => [column.id, column]))
  // A draft of `undefined` is the column's DEFAULT, staged by the editor's Default button.
  const statementValue = (columnId: string, value: unknown) => {
    if (value === undefined) {
      return sql`default`
    }
    const column = columnsById.get(columnId)
    return (
      (column &&
        createTransformer(connection.type, column).toStatement?.(value)) ??
      value
    )
  }

  const errorCount =
    drafts.filter((d) => !!d.error).length +
    newRows.filter((row) => !!row.error).length
  const rowCount = rowsWithDrafts.size + newRows.length

  const handleDiscard = () => {
    clear()
    setIsReviewOpen(false)
  }

  const { mutate: saveDrafts, isPending: isSaving } = useMutation({
    meta: { event: 'row_changes_saved' },
    mutationFn: async () => {
      if (primaryColumns.length === 0) {
        throw new Error(
          'No primary keys found. Please use a query to update rows.'
        )
      }

      const { filters, orderBy } = store.get()
      const rowsQueryOpts = resourceRowsQueryInfiniteOptions({
        connectionResource,
        query: { filters, orderBy },
        schema,
        table,
      })

      const cachedData = queryClient.getQueryData(rowsQueryOpts.queryKey)

      if (!cachedData) {
        throw new Error('No data found. Please refresh the page.')
      }

      const allRows = cachedData.pages.flatMap((page) => page.rows)
      const rowEntries = [...rowsWithDrafts.values()]
      const newRowIds = newRows.map((row) => row.id)

      for (const rowDrafts of rowEntries) {
        const [firstDraft] = rowDrafts
        if (!firstDraft) {
          continue
        }
        setRowStatus(firstDraft.primaryKeys, {
          error: undefined,
          isCommitting: true,
        })
      }
      for (const { id } of newRows) {
        newRowStatus.setStatus(id, { error: undefined, isCommitting: true })
      }

      let failedPrimaryKeys: PrimaryKeys | null = null
      let failedNewRowId: string | null = null

      const queryParams =
        await connectionResourceToQueryParams(connectionResource)

      try {
        const commits = await transaction(queryParams).execute(async (tx) => {
          const allRowsByPrimaryKey = new Map(
            allRows.map(
              (row) =>
                [getRowKeyByPrimaryKeys(row, primaryColumns), row] as const
            )
          )
          const pendingCommits: {
            primaryKeys: PrimaryKeys
            values: Record<string, unknown>
            modifiedColumns: string[]
            updatedFilters: ActiveFilter[]
          }[] = []

          for (const rowDrafts of rowEntries) {
            const [firstDraft] = rowDrafts
            if (!firstDraft) {
              continue
            }
            const { primaryKeys } = firstDraft
            failedPrimaryKeys = primaryKeys

            const row = allRowsByPrimaryKey.get(primaryKeysKey(primaryKeys))

            if (!row) {
              removeRow(primaryKeys)
              throw new Error(
                'Row not found in cache. Discarding change for this row.'
              )
            }

            const sqlFilters: ActiveFilter[] = primaryColumns.map((column) => ({
              column,
              ref: EQUAL_FILTER,
              values: [row[column]],
            }))

            const values: Record<string, unknown> = {}
            const statement: Record<string, unknown> = {}
            for (const draft of rowDrafts) {
              values[draft.columnId] = draft.value
              statement[draft.columnId] = statementValue(
                draft.columnId,
                draft.value
              )
            }

            // oxlint-disable-next-line no-await-in-loop
            await setQuery({
              filters: sqlFilters,
              schema,
              table,
              values: statement,
            }).run(queryParams, tx)

            const modifiedColumns = Object.keys(values)
            const updatedFilters = sqlFilters.map((filter) =>
              modifiedColumns.includes(filter.column)
                ? { ...filter, values: [values[filter.column]] }
                : filter
            )

            pendingCommits.push({
              modifiedColumns,
              primaryKeys,
              updatedFilters,
              values,
            })
          }

          failedPrimaryKeys = null

          for (const { id, values } of newRows) {
            failedNewRowId = id
            const statement = Object.fromEntries(
              Object.entries(values)
                .filter(([, value]) => value !== undefined)
                .map(([columnId, value]) => [
                  columnId,
                  statementValue(columnId, value),
                ])
            )
            // oxlint-disable-next-line no-await-in-loop
            await insertRowQuery({ schema, table, values: statement }).run(
              queryParams,
              tx
            )
          }

          failedNewRowId = null
          return pendingCommits
        })

        return {
          commits,
          newRowIds,
          queryParams,
          rowsQueryOpts,
          status: 'success' as const,
        }
      } catch (error) {
        return {
          error,
          failedNewRowId,
          failedPrimaryKeys,
          newRowIds,
          rowEntries,
          status: 'error' as const,
        }
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: async (data) => {
      if (data.status === 'error') {
        const {
          error,
          failedNewRowId,
          failedPrimaryKeys,
          newRowIds,
          rowEntries,
        } = data

        for (const rowDrafts of rowEntries) {
          const [firstDraft] = rowDrafts
          if (!firstDraft) {
            continue
          }
          setRowStatus(firstDraft.primaryKeys, { isCommitting: false })
        }
        for (const id of newRowIds) {
          newRowStatus.setStatus(id, { isCommitting: false })
        }

        const message = error instanceof Error ? error.message : String(error)

        if (failedNewRowId !== null) {
          newRowStatus.setStatus(failedNewRowId, { error: message })
        }

        if (failedPrimaryKeys === null) {
          toast.error('Failed to save changes', {
            description: message,
            duration: 6000,
          })
        } else {
          setRowStatus(failedPrimaryKeys, {
            error: message,
            isCommitting: false,
          })

          toast.error('Failed to save changes', {
            description: message,
            duration: 6000,
            id: `save-transaction-error-${primaryKeysKey(failedPrimaryKeys)}-${message}`,
          })
        }

        return
      }

      const { commits, newRowIds, queryParams, rowsQueryOpts } = data

      const savedValuesByRow = new Map(
        await Promise.all(
          commits.map(
            async ({
              primaryKeys,
              values,
              modifiedColumns,
              updatedFilters,
            }) => {
              const refreshed = await selectQuery({
                filters: updatedFilters,
                schema,
                select: modifiedColumns,
                table,
              })
                .run(queryParams)
                .then((rows) => rows[0])
                .catch(() => {
                  toast.warning('Failed to refresh row', {
                    description: `Failed to refresh row ${primaryKeysKey(primaryKeys)}`,
                  })
                  return null
                })

              return [
                primaryKeysKey(primaryKeys),
                { primaryKeys, values: refreshed ?? values },
              ] as const
            }
          )
        )
      )

      queryClient.setQueryData(rowsQueryOpts.queryKey, (queryData) => {
        if (!queryData) {
          return queryData
        }

        return {
          ...queryData,
          pages: queryData.pages.map((page) => ({
            ...page,
            rows: page.rows.map((row) => {
              const savedValues = savedValuesByRow.get(
                getRowKeyByPrimaryKeys(row, primaryColumns)
              )
              if (!savedValues) {
                return row
              }
              return { ...row, ...savedValues.values }
            }),
          })),
        }
      })

      for (const { primaryKeys } of savedValuesByRow.values()) {
        removeRow(primaryKeys)
      }
      for (const id of newRowIds) {
        newRowStatus.remove(id)
      }

      const { filters, orderBy } = store.get()

      if (
        newRowIds.length > 0 ||
        filters.length > 0 ||
        Object.keys(orderBy).length > 0
      ) {
        queryClient.invalidateQueries({
          queryKey: rowsQueryOpts.queryKey.slice(0, -1),
        })
      }
      if (newRowIds.length > 0) {
        queryClient.invalidateQueries({
          queryKey: resourceTableTotalQueryKey({
            connectionResource,
            schema,
            table,
          }),
        })
      }

      const count = savedValuesByRow.size + newRowIds.length
      toast.success(`Saved ${count} row${count === 1 ? '' : 's'}`)

      setIsReviewOpen(false)
    },
  })

  const handleSave = () => {
    saveDrafts()
  }

  useSaveHotkey(handleSave, changeCount === 0 || isSaving)

  return (
    <>
      <AnimatePresence initial={false}>
        {changeCount > 0 && (
          <motion.div
            key="drafts"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="flex shrink-0 items-center gap-1 overflow-x-clip"
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative overflow-visible"
                    aria-label="Review changes"
                    onClick={() => setIsReviewOpen(true)}
                    disabled={isSaving}
                  />
                }
              >
                <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
                {errorCount > 0 && (
                  <span
                    aria-hidden
                    className="bg-destructive text-2xs absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-medium text-white tabular-nums"
                  >
                    {errorCount}
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex flex-col gap-0.5">
                  <span>Review changes before saving</span>
                  {errorCount > 0 && (
                    <span className="opacity-70">
                      {errorCount} change{errorCount === 1 ? '' : 's'} failed
                    </span>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={<Button onClick={handleSave} disabled={isSaving} />}
              >
                <LoadingContent loading={isSaving}>
                  Save ({changeCount})
                </LoadingContent>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex flex-col gap-0.5">
                  <span>
                    Save {changeCount} unsaved change
                    {changeCount === 1 ? '' : 's'} in {rowCount} row
                    {rowCount === 1 ? '' : 's'} atomically in a transaction
                  </span>
                  <KbdCtrlLetter userAgent={navigator.userAgent} letter="S" />
                </div>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
      <DraftsReviewDrawer
        open={isReviewOpen}
        onOpenChange={setIsReviewOpen}
        table={table}
        schema={schema}
        isSaving={isSaving}
        onSave={handleSave}
        onDiscardAll={handleDiscard}
      />
    </>
  )
}
