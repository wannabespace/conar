import { ViewIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import { SQL_FILTERS_LIST } from '@tamery/shared/filters'
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
import type { Kysely } from 'kysely'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries'
import { buildWhere } from '~/entities/connection/queries/rows'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime'
import { dialects } from '~/entities/connection/runtime/dialects'
import { useSaveHotkey } from '~/hooks/use-save-hotkey'
import { queryClient } from '~/main'

import { useTableColumnsContext } from '../../-lib/columns'
import type { PrimaryKeys } from '../../-lib/session-store'
import {
  draftsActions,
  getRowKeyByPrimaryKeys,
  primaryKeysKey,
  useTableSessionStore,
} from '../../-lib/session-store'
import { useTablePageStore } from '../../-lib/store'
import { DraftsReviewDrawer } from '../table/drafts-review-drawer'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const DraftsActions = ({
  table,
  schema,
}: {
  table: string
  schema: string
}) => {
  const { connectionResource } = useRouteContext()
  const store = useTablePageStore()
  const sessionStore = useTableSessionStore()
  const { columns } = useTableColumnsContext()
  const primaryColumns = columns.filter((c) => c.primaryKey).map((c) => c.id)
  const drafts = useSubscription(sessionStore, {
    selector: (state) => Object.values(state.drafts),
  })
  const rowsWithDrafts = Map.groupBy(drafts, (d) =>
    primaryKeysKey(d.primaryKeys)
  )
  const { clear, removeRow, setRowStatus } = draftsActions(sessionStore)
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const errorCount = drafts.filter((d) => !!d.error).length
  const rowCount = rowsWithDrafts.size

  const handleDiscard = () => {
    clear()
    setIsReviewOpen(false)
  }

  const createDb = async () => {
    const queryParams =
      await connectionResourceToQueryParams(connectionResource)
    return dialects[queryParams.type]({
      connectionString: queryParams.connectionString,
      resourceId: queryParams.resourceId,
      log: queryParams.log,
      // oxlint-disable-next-line ts/no-explicit-any
    }) as unknown as Kysely<any>
  }

  const { mutate: saveDrafts, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (primaryColumns.length === 0) {
        throw new Error(
          'No primary keys found. Please use a query to update rows.'
        )
      }

      const { filters, orderBy } = store.get()
      const rowsQueryOpts = resourceRowsQueryInfiniteOptions({
        connectionResource,
        table,
        schema,
        query: { filters, orderBy },
      })

      const cachedData = queryClient.getQueryData(rowsQueryOpts.queryKey)

      if (!cachedData) {
        throw new Error('No data found. Please refresh the page.')
      }

      const allRows = cachedData.pages.flatMap((page) => page.rows)
      const rowEntries = [...rowsWithDrafts.values()]

      const equalFilter = SQL_FILTERS_LIST.find((f) => f.operator === '=')
      if (!equalFilter) {
        throw new Error('Equal filter operator is not configured')
      }

      for (const rowDrafts of rowEntries) {
        const [firstDraft] = rowDrafts
        if (!firstDraft) {
          continue
        }
        setRowStatus(firstDraft.primaryKeys, {
          isCommitting: true,
          error: undefined,
        })
      }

      let failedPrimaryKeys: PrimaryKeys | null = null

      const db = await createDb()

      try {
        const commits = await db.transaction().execute(async (tx) => {
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
              ref: equalFilter,
              values: [row[column]],
            }))

            const values: Record<string, unknown> = {}
            for (const draft of rowDrafts) {
              values[draft.columnId] = draft.value
            }

            // oxlint-disable-next-line no-await-in-loop
            await tx
              .withSchema(schema)
              .$extendTables<{ [table]: Record<string, unknown> }>()
              .updateTable(table)
              .set(values)
              .where((eb) => buildWhere(eb, sqlFilters))
              .execute()

            const modifiedColumns = Object.keys(values)
            const updatedFilters = sqlFilters.map((filter) =>
              modifiedColumns.includes(filter.column)
                ? { ...filter, values: [values[filter.column]] }
                : filter
            )

            pendingCommits.push({
              primaryKeys,
              values,
              modifiedColumns,
              updatedFilters,
            })
          }

          failedPrimaryKeys = null
          return pendingCommits
        })

        return {
          status: 'success' as const,
          commits,
          rowEntries,
          rowsQueryOpts,
          filters,
          orderBy,
        }
      } catch (error) {
        return {
          status: 'error' as const,
          error,
          failedPrimaryKeys,
          rowEntries,
        }
      }
    },
    onSuccess: async (data) => {
      if (data.status === 'error') {
        const { error, failedPrimaryKeys, rowEntries } = data

        for (const rowDrafts of rowEntries) {
          const [firstDraft] = rowDrafts
          if (!firstDraft) {
            continue
          }
          setRowStatus(firstDraft.primaryKeys, { isCommitting: false })
        }

        const message = error instanceof Error ? error.message : String(error)

        if (failedPrimaryKeys === null) {
          toast.error('Failed to save changes', {
            description: message,
            duration: 6000,
          })
        } else {
          setRowStatus(failedPrimaryKeys, {
            isCommitting: false,
            error: message,
          })

          toast.error('Failed to save changes', {
            id: `save-transaction-error-${primaryKeysKey(failedPrimaryKeys)}-${message}`,
            description: message,
            duration: 6000,
          })
        }

        return
      }

      const { commits, rowsQueryOpts } = data

      const db = await createDb()

      const savedValuesByRow = new Map(
        await Promise.all(
          commits.map(
            async ({
              primaryKeys,
              values,
              modifiedColumns,
              updatedFilters,
            }) => {
              const refreshed = await db
                .withSchema(schema)
                .$extendTables<{ [table]: Record<string, unknown> }>()
                .selectFrom(table)
                .select(modifiedColumns)
                .where((eb) => buildWhere(eb, updatedFilters))
                .execute()
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

      const { filters, orderBy } = store.get()

      if (filters.length > 0 || Object.keys(orderBy).length > 0) {
        queryClient.invalidateQueries({
          queryKey: rowsQueryOpts.queryKey.slice(0, -1),
        })
      }

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

  useSaveHotkey(handleSave, drafts.length === 0 || isSaving)

  return (
    <>
      <AnimatePresence initial={false}>
        {drafts.length > 0 && (
          <motion.div
            key="drafts"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="flex shrink-0 items-center gap-1 overflow-hidden"
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative overflow-visible"
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
              <TooltipContent side="top">
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
                  Save ({drafts.length})
                </LoadingContent>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="flex flex-col gap-0.5">
                  <span>
                    Save {drafts.length} unsaved change
                    {drafts.length === 1 ? '' : 's'} in {rowCount} row
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
