import type { ActiveFilter } from '@conar/shared/filters'
import type { Kysely } from 'kysely'
import type { primaryKeysType } from '../../-store'
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
import { motion } from 'motion/react'
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
import { draftsActions, getRowKeyByPrimaryKeys, primaryKeysKey, useTablePageStore } from '../../-store'
import { DraftsReviewDrawer } from './drafts-review-drawer'

const motionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
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
  const rowsWithDrafts = Map.groupBy(drafts, d => primaryKeysKey(d.primaryKeys))
  const { clear, removeRow, setRowStatus } = draftsActions(store)
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const errorCount = drafts.filter(d => !!d.error).length
  const rowCount = rowsWithDrafts.size

  const handleDiscard = () => {
    clear()
    setIsReviewOpen(false)
  }

  const queryParams = connectionResourceToQueryParams(connectionResource)
  const db = dialects[queryParams.type]({
    connectionString: queryParams.connectionString,
    log: queryParams.log,
    // eslint-disable-next-line ts/no-explicit-any
  }) as unknown as Kysely<any>

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
      const rowEntries = Array.from(rowsWithDrafts.values())

      for (const rowDrafts of rowEntries) {
        setRowStatus(rowDrafts[0]!.primaryKeys, { isCommitting: true, error: undefined })
      }

      let failedPrimaryKeys: typeof primaryKeysType.infer | null = null

      try {
        const commits = await db.transaction().execute(async (tx) => {
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

            await tx
              .withSchema(schema)
              .withTables<{ [table]: Record<string, unknown> }>()
              .updateTable(table)
              .set(values)
              .where(eb => buildWhere(eb, sqlFilters))
              .execute()

            const modifiedColumns = Object.keys(values)
            const updatedFilters = sqlFilters.map(filter => modifiedColumns.includes(filter.column)
              ? { ...filter, values: [values[filter.column]] }
              : filter)

            commits.push({ primaryKeys, values, modifiedColumns, updatedFilters })
          }

          failedPrimaryKeys = null
          return commits
        })

        return { status: 'success' as const, commits, rowEntries, rowsQueryOpts, filters, orderBy }
      }
      catch (error) {
        return { status: 'error' as const, error, failedPrimaryKeys, rowEntries }
      }
    },
    onSuccess: async (data) => {
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
        }
        else {
          toast.error('Failed to save changes', {
            description: message,
            duration: 6000,
          })
        }

        return
      }

      const { commits, rowsQueryOpts } = data

      const savedValuesByRow = new Map(
        await Promise.all(commits.map(async ({ primaryKeys, values, modifiedColumns, updatedFilters }) => {
          const refreshed = await db
            .withSchema(schema)
            .withTables<{ [table]: Record<string, unknown> }>()
            .selectFrom(table)
            .select(modifiedColumns)
            .where(eb => buildWhere(eb, updatedFilters))
            .execute()
            .then(rows => rows[0])
            .catch(() => {
              toast.warning('Failed to refresh row', { description: `Failed to refresh row ${primaryKeysKey(primaryKeys)}` })
              return null
            })

          return [
            primaryKeysKey(primaryKeys),
            { primaryKeys, values: refreshed ?? values },
          ] as const
        })),
      )

      queryClient.setQueryData(rowsQueryOpts.queryKey, (data) => {
        if (!data)
          return data

        return {
          ...data,
          pages: data.pages.map(page => ({
            ...page,
            rows: page.rows.map((row) => {
              const savedValues = savedValuesByRow.get(getRowKeyByPrimaryKeys(row, primaryColumns))
              if (!savedValues)
                return row
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
      <motion.div
        variants={motionVariants}
        animate={drafts.length > 0 ? 'visible' : 'hidden'}
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
              {drafts.length}
            </span>
            {' '}
            unsaved change
            {drafts.length === 1 ? '' : 's'}
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
              disabled={isSaving || drafts.length === 0}
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
              disabled={isSaving || drafts.length === 0}
            >
              <LoadingContent loading={isSaving}>
                Save
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
      </motion.div>
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
