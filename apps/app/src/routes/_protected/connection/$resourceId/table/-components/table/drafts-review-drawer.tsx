import {
  RiArrowGoBackLine,
  RiArrowRightLine,
  RiErrorWarningLine,
  RiSaveLine,
} from '@remixicon/react'
import { pick } from '@tamery/shared/utils/helpers'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@tamery/ui/components/drawer'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useSubscription } from 'seitu/react'

import { resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries'
import { createTransformer, getDisplayValue } from '~/entities/connection/transformers'

import { useTableColumns } from '../../-lib/columns'
import type { draftType } from '../../-lib/store'
import {
  draftsActions,
  getRowKeyByPrimaryKeys,
  primaryKeysKey,
  useTablePageStore,
} from '../../-lib/store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

function Value({ value, children }: { value: unknown; children: string }) {
  const isEmpty = value === null || value === undefined || value === ''

  return (
    <span
      title={children}
      className={cn('line-clamp-3 wrap-break-word', isEmpty && 'text-muted-foreground/60 italic')}
    >
      {isEmpty ? String(value ?? 'null') || 'empty' : children}
    </span>
  )
}

export function DraftsReviewDrawer({
  open,
  onOpenChange,
  table,
  schema,
  isSaving,
  onSave,
  onDiscardAll,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: string
  schema: string
  isSaving: boolean
  onSave: () => void
  onDiscardAll: () => void
}) {
  const { connection, connectionResource } = useRouteContext()
  const columns = useTableColumns()
  const primaryColumns = columns.filter(c => c.primaryKey).map(c => c.id)
  const store = useTablePageStore()
  const drafts = useSubscription(store, { selector: state => state.drafts })
  const { filters, orderBy } = useSubscription(store, {
    selector: state => pick(state, ['filters', 'orderBy']),
  })
  const { remove: removeDraft, removeRow } = draftsActions(store)

  const { data: rows = [] } = useInfiniteQuery(
    resourceRowsQueryInfiniteOptions({
      connectionResource,
      table,
      schema,
      query: { filters, orderBy },
    }),
  )

  const rowsByPrimaryKey = new Map(
    rows.map(
      (row, index) => [getRowKeyByPrimaryKeys(row, primaryColumns), { row, index }] as const,
    ),
  )
  const draftIndex = (rowDrafts: (typeof draftType.infer)[]) =>
    rowsByPrimaryKey.get(primaryKeysKey(rowDrafts[0]!.primaryKeys))?.index ??
    Number.MAX_SAFE_INTEGER
  const rowsEntries = Array.from(
    Map.groupBy(drafts, d => primaryKeysKey(d.primaryKeys)).values(),
  ).toSorted((a, b) => draftIndex(a) - draftIndex(b))

  const columnDisplay = (columnId: string, value: unknown) => {
    const column = columns.find(c => c.id === columnId)

    if (!column) return getDisplayValue(value, Number.POSITIVE_INFINITY)

    return createTransformer(connection.type, column).toDisplay(value, Number.POSITIVE_INFINITY)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="max-w-2xl">
        <DrawerHeader>
          <DrawerTitle>Review changes</DrawerTitle>
          <DrawerDescription>
            {drafts.length} change
            {drafts.length === 1 ? '' : 's'} in{' '}
            <span data-mask className="font-medium">
              {schema}.{table}
            </span>
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
          {rowsEntries.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div
                className="
                  mb-4 flex size-12 items-center justify-center rounded-2xl
                  bg-muted/60
                "
              >
                <RiSaveLine className="size-6 text-muted-foreground/70" />
              </div>
              <div className="text-sm font-medium">Nothing to review</div>
              <p className="mt-1 max-w-56 text-xs text-muted-foreground">
                Edit cells in the table and the changes will show up here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rowsEntries.map(rowDrafts => {
                const { primaryKeys } = rowDrafts[0]!
                const row = rowsByPrimaryKey.get(primaryKeysKey(primaryKeys))?.row
                const primaryLabel = Object.entries(primaryKeys)
                  .map(([columnId, value]) => `${columnId} = ${columnDisplay(columnId, value)}`)
                  .join(' · ')

                return (
                  <div
                    key={primaryKeysKey(primaryKeys)}
                    className="rounded-xl border bg-card shadow-xs"
                  >
                    <header className="flex h-9 items-center gap-2 border-b pr-1.5 pl-3">
                      <span
                        data-mask
                        title={primaryLabel || undefined}
                        className="
                          min-w-0 flex-1 truncate font-mono text-2xs
                          text-muted-foreground
                        "
                      >
                        {primaryLabel || 'Unknown row'}
                      </span>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="shrink-0 text-muted-foreground"
                              onClick={() => removeRow(primaryKeys)}
                              disabled={isSaving}
                            />
                          }
                        >
                          <RiArrowGoBackLine />
                        </TooltipTrigger>
                        <TooltipContent>Discard row</TooltipContent>
                      </Tooltip>
                    </header>
                    <div className="flex flex-col">
                      {rowDrafts.map(draft => {
                        const before = row ? columnDisplay(draft.columnId, row[draft.columnId]) : ''
                        const after = columnDisplay(draft.columnId, draft.value)

                        return (
                          <div
                            key={draft.columnId}
                            className="
                              group flex items-start gap-3 border-b py-2 pr-1.5
                              pl-3
                              last:border-b-0
                            "
                          >
                            <span
                              data-mask
                              title={draft.columnId}
                              className="
                                w-28 shrink-0 truncate pt-0.5 font-mono text-2xs
                                font-medium text-muted-foreground
                              "
                            >
                              {draft.columnId}
                            </span>
                            <div
                              data-mask
                              className="
                                flex min-w-0 flex-1 items-start gap-2 font-mono
                                text-xs
                              "
                            >
                              <div className="min-w-0 flex-1 text-muted-foreground">
                                <Value value={row?.[draft.columnId]}>{before}</Value>
                              </div>
                              <RiArrowRightLine
                                className="
                                  mt-0.5 size-3 shrink-0 text-muted-foreground/50
                                "
                              />
                              <div className="min-w-0 flex-1">
                                <Value value={draft.value}>{after}</Value>
                                {draft.error && (
                                  <p
                                    className="
                                      mt-1 flex items-start gap-1 font-sans
                                      text-2xs text-destructive
                                    "
                                  >
                                    <RiErrorWarningLine className="mt-px size-3 shrink-0" />
                                    {draft.error}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="
                                      shrink-0 text-muted-foreground opacity-0
                                      transition-opacity
                                      group-hover:opacity-100
                                      focus-visible:opacity-100
                                    "
                                    onClick={() => removeDraft(primaryKeys, draft.columnId)}
                                    disabled={isSaving}
                                  />
                                }
                              >
                                <RiArrowGoBackLine />
                              </TooltipTrigger>
                              <TooltipContent>Discard change</TooltipContent>
                            </Tooltip>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <DrawerFooter>
          <Button
            variant="ghost"
            onClick={onDiscardAll}
            disabled={isSaving || drafts.length === 0}
            className="mr-auto text-muted-foreground"
          >
            <RiArrowGoBackLine />
            Discard all
          </Button>
          <DrawerClose render={<Button variant="outline">Close</Button>} />
          <Button onClick={onSave} disabled={isSaving || drafts.length === 0}>
            <LoadingContent loading={isSaving}>
              Save {drafts.length} change{drafts.length === 1 ? '' : 's'}
            </LoadingContent>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
