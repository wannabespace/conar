import { RiAlertLine, RiEyeLine } from '@remixicon/react'
import type { ActiveFilter } from '@tamery/shared/filters'
import { SQL_FILTERS_LIST } from '@tamery/shared/filters'
import { getOS } from '@tamery/shared/utils/os'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
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

import { useTableColumns } from '../../columns'
import type { primaryKeysType } from '../../store'
import {
  draftsActions,
  getRowKeyByPrimaryKeys,
  primaryKeysKey,
  useTablePageStore,
} from '../../store'
import { DraftsReviewDrawer } from './drafts-review-drawer'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const os = getOS(navigator.userAgent)

export function DraftsToolbar({ table, schema }: { table: string; schema: string }) {
  const { connectionResource } = useRouteContext()
  const store = useTablePageStore()
  const columns = useTableColumns()
  const primaryColumns = columns.filter(c => c.primaryKey).map(c => c.id)
  const drafts = useSubscription(store, { selector: state => state.drafts })
  const rowsWithDrafts = Map.groupBy(drafts, d => primaryKeysKey(d.primaryKeys))
  const { clear, removeRow, setRowStatus } = draftsActions(store)
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const errorCount = drafts.filter(d => !!d.error).length
  const rowCount = rowsWithDrafts.size

  const handleDiscard = () => {
    clear()
    setIsReviewOpen(false)
  }

  async function createDb() {
    const queryParams = await connectionResourceToQueryParams(connectionResource)
    return dialects[queryParams.type]({
      connectionString: queryParams.connectionString,
      resourceId: queryParams.resourceId,
      log: queryParams.log,
      // oxlint-disable-next-line ts/no-explicit-any
    }) as unknown as Kysely<any>
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

      if (!cachedData) throw new Error('No data found. Please refresh the page.')

      const allRows = cachedData.pages.flatMap(page => page.rows)
      const rowEntries = Array.from(rowsWithDrafts.values())

      for (const rowDrafts of rowEntries) {
        setRowStatus(rowDrafts[0]!.primaryKeys, { isCommitting: true, error: undefined })
      }

      let failedPrimaryKeys: typeof primaryKeysType.infer | null = null

      const db = await createDb()

      try {
        const commits = await db.transaction().execute(async tx => {
          const allRowsByPrimaryKey = new Map(
            allRows.map(row => [getRowKeyByPrimaryKeys(row, primaryColumns), row] as const),
          )
          const commits: {
            primaryKeys: typeof primaryKeysType.infer
            values: Record<string, unknown>
            modifiedColumns: string[]
            updatedFilters: ActiveFilter[]
          }[] = []

          for (const rowDrafts of rowEntries) {
            const { primaryKeys } = rowDrafts[0]!
            failedPrimaryKeys = primaryKeys

            const row = allRowsByPrimaryKey.get(primaryKeysKey(primaryKeys))

            if (!row) {
              removeRow(primaryKeys)
              throw new Error('Row not found in cache. Discarding change for this row.')
            }

            const sqlFilters: ActiveFilter[] = primaryColumns.map(column => ({
              column,
              ref: SQL_FILTERS_LIST.find(f => f.operator === '=')!,
              values: [row[column]],
            }))

            const values = rowDrafts.reduce<Record<string, unknown>>((acc, d) => {
              acc[d.columnId] = d.value
              return acc
            }, {})

            // Sequential by design: updates run in order within a single transaction
            // oxlint-disable-next-line no-await-in-loop
            await tx
              .withSchema(schema)
              .withTables<{ [table]: Record<string, unknown> }>()
              .updateTable(table)
              .set(values)
              .where(eb => buildWhere(eb, sqlFilters))
              .execute()

            const modifiedColumns = Object.keys(values)
            const updatedFilters = sqlFilters.map(filter =>
              modifiedColumns.includes(filter.column)
                ? { ...filter, values: [values[filter.column]] }
                : filter,
            )

            commits.push({ primaryKeys, values, modifiedColumns, updatedFilters })
          }

          failedPrimaryKeys = null
          return commits
        })

        return { status: 'success' as const, commits, rowEntries, rowsQueryOpts, filters, orderBy }
      } catch (error) {
        return { status: 'error' as const, error, failedPrimaryKeys, rowEntries }
      }
    },
    onSuccess: async data => {
      if (data.status === 'error') {
        const { error, failedPrimaryKeys, rowEntries } = data

        for (const rowDrafts of rowEntries) {
          setRowStatus(rowDrafts[0]!.primaryKeys, { isCommitting: false })
        }

        const message = error instanceof Error ? error.message : String(error)

        if (failedPrimaryKeys !== null) {
          setRowStatus(failedPrimaryKeys, {
            isCommitting: false,
            error: message,
          })

          toast.error('Failed to save changes', {
            id: `save-transaction-error-${primaryKeysKey(failedPrimaryKeys)}-${message}`,
            description: message,
            duration: 6000,
          })
        } else {
          toast.error('Failed to save changes', {
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
          commits.map(async ({ primaryKeys, values, modifiedColumns, updatedFilters }) => {
            const refreshed = await db
              .withSchema(schema)
              .withTables<{ [table]: Record<string, unknown> }>()
              .selectFrom(table)
              .select(modifiedColumns)
              .where(eb => buildWhere(eb, updatedFilters))
              .execute()
              .then(rows => rows[0])
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
          }),
        ),
      )

      queryClient.setQueryData(rowsQueryOpts.queryKey, data => {
        if (!data) return data

        return {
          ...data,
          pages: data.pages.map(page => ({
            ...page,
            rows: page.rows.map(row => {
              const savedValues = savedValuesByRow.get(getRowKeyByPrimaryKeys(row, primaryColumns))
              if (!savedValues) return row
              return { ...row, ...savedValues.values }
            }),
          })),
        }
      })

      for (const { primaryKeys } of savedValuesByRow.values()) {
        removeRow(primaryKeys)
      }

      const { filters, orderBy } = store.get()

      if (filters.length > 0 || Object.keys(orderBy).length > 0)
        queryClient.invalidateQueries({ queryKey: rowsQueryOpts.queryKey.slice(0, -1) })

      const count = savedValuesByRow.size
      toast.success(`Saved ${count} row${count === 1 ? '' : 's'}`)

      setIsReviewOpen(false)
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const handleSave = () => {
    saveDrafts()
  }

  useSaveHotkey(handleSave, drafts.length === 0 || isSaving)

  return (
    <>
      {/* Renders as the command bar's top row — no floating shell of its own,
          so unsaved-changes state lives in the same surface as everything else */}
      <AnimatePresence initial={false}>
        {drafts.length > 0 && (
          <motion.div
            key="drafts"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 border-b py-1.5 pr-1.5 pl-3">
              <div className="flex min-w-0 items-center gap-2 text-xs">
                {errorCount > 0 && (
                  <>
                    <span className="flex items-center gap-1 text-destructive">
                      <RiAlertLine className="size-3.5" />
                      <span className="font-medium">{errorCount} failed</span>
                    </span>
                    <span className="text-muted-foreground">·</span>
                  </>
                )}
                <span className="truncate">
                  <span className="font-medium">{drafts.length}</span> unsaved change
                  {drafts.length === 1 ? '' : 's'} in{' '}
                  <span className="font-medium">{rowCount}</span> row
                  {rowCount === 1 ? '' : 's'}
                </span>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() => setIsReviewOpen(true)}
                        disabled={isSaving}
                      />
                    }
                  >
                    <RiEyeLine className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent side="top">Review changes before saving</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={<Button size="xs" onClick={handleSave} disabled={isSaving} />}
                  >
                    <LoadingContent loading={isSaving}>Save</LoadingContent>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="flex flex-col gap-0.5">
                      <span>Save all unsaved changes atomically in a transaction</span>
                      <span className="whitespace-nowrap opacity-70">
                        {os?.type === 'macos' ? '⌘' : 'Ctrl'} + S
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
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
