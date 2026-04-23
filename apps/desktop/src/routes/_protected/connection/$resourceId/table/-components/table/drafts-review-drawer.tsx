import type { TableDraft } from '../../-store'
import { pick } from '@conar/shared/utils/helpers'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from '@conar/ui/components/drawer'
import { cn } from '@conar/ui/lib/utils'
import { RiAlertLine, RiArrowRightLine, RiCloseLine, RiSaveLine } from '@remixicon/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSubscription } from 'seitu/react'
import { resourceRowsQueryInfiniteOptions } from '~/entities/connection/queries'
import { createTransformer, getDisplayValue } from '~/entities/connection/transformers'
import { Route } from '../..'
import { useTableColumns } from '../../-columns'
import { draftsActions, useTablePageStore } from '../../-store'

const DISPLAY_SIZE = 500

function ValueCell({
  value,
  children,
  className,
}: {
  value: unknown
  children: string
  className?: string
}) {
  const isSpecial = value === null || value === undefined || value === ''

  return (
    <div
      className={cn(
        `
          min-w-0 flex-1 truncate rounded-sm bg-muted/50 px-1.5 py-0.5 font-mono
          text-xs
        `,
        isSpecial && 'text-muted-foreground italic',
        className,
      )}
      title={children}
    >
      {children}
    </div>
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
  const { connection, connectionResource } = Route.useRouteContext()
  const columns = useTableColumns()
  const primaryColumns = columns.filter(c => c.primaryKey).map(c => c.id)
  const store = useTablePageStore()
  const drafts = useSubscription(store, { selector: state => state.drafts })
  const { filters, orderBy } = useSubscription(store, { selector: state => pick(state, ['filters', 'orderBy']) })
  const { remove: removeDraft, removeRow } = draftsActions(store)

  const { data: rows = [] } = useInfiniteQuery(resourceRowsQueryInfiniteOptions({
    connectionResource,
    table,
    schema,
    query: { filters, orderBy },
  }))

  const rowEntries = useMemo(() => {
    const map = new Map<number, TableDraft[]>()
    for (const d of drafts) {
      const list = map.get(d.rowIndex) ?? []
      list.push(d)
      map.set(d.rowIndex, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b)
  }, [drafts])

  const errorCount = drafts.filter(d => !!d.error).length

  const displayFor = (columnId: string, value: unknown) => {
    const column = columns.find(c => c.id === columnId)

    if (!column)
      return getDisplayValue(value, DISPLAY_SIZE)

    return createTransformer(connection.type, column).toDisplay(value, DISPLAY_SIZE)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} position="right">
      <DrawerPopup
        showCloseButton
        variant="inset"
        position="right"
        className="max-w-xl"
      >
        <DrawerHeader>
          <DrawerTitle>Review changes</DrawerTitle>
          <DrawerDescription>
            {drafts.length}
            {' '}
            unsaved change
            {drafts.length === 1 ? '' : 's'}
            {' '}
            in
            {' '}
            <span className="font-medium">
              {schema}
              .
              {table}
            </span>
            {errorCount > 0 && (
              <>
                {' · '}
                <span className="
                  inline-flex items-center gap-1 text-destructive
                "
                >
                  <RiAlertLine className="size-3.5" />
                  {errorCount}
                  {' '}
                  failed
                </span>
              </>
            )}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerPanel>
          {rowEntries.length === 0
            ? (
                <div className="
                  flex h-40 items-center justify-center text-sm
                  text-muted-foreground
                "
                >
                  No pending changes
                </div>
              )
            : (
                <div className="flex flex-col gap-3">
                  {rowEntries.map(([rowIndex, rowDrafts]) => {
                    const row = rows[rowIndex]
                    const primaryLabel = row && primaryColumns.length > 0
                      ? primaryColumns.map(pc => `${pc}: ${displayFor(pc, row[pc])}`).join(', ')
                      : `row #${rowIndex + 1}`

                    return (
                      <div
                        key={rowIndex}
                        className="flex flex-col gap-2 rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="
                              truncate font-mono text-xs text-muted-foreground
                            "
                            title={primaryLabel}
                          >
                            {primaryLabel}
                          </span>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => removeRow(rowIndex)}
                            disabled={isSaving}
                            className="ml-auto"
                          >
                            <RiCloseLine className="size-3.5" />
                            Discard row
                          </Button>
                        </div>
                        <div className="flex flex-col gap-1">
                          {rowDrafts.map((draft) => {
                            const before = row ? displayFor(draft.columnId, row[draft.columnId]) : 'unavailable'
                            const after = displayFor(draft.columnId, draft.value)

                            return (
                              <div
                                key={draft.columnId}
                                className="flex flex-col gap-1"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="
                                    shrink-0 font-mono text-xs font-medium
                                  "
                                  >
                                    {draft.columnId}
                                  </span>
                                  <ValueCell value={row?.[draft.columnId]}>{before}</ValueCell>
                                  <RiArrowRightLine className="
                                    size-3.5 shrink-0 text-muted-foreground
                                  "
                                  />
                                  <ValueCell
                                    value={draft.value}
                                    className="
                                      bg-warning/15 text-warning-foreground
                                    "
                                  >
                                    {after}
                                  </ValueCell>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => removeDraft(rowIndex, draft.columnId)}
                                    disabled={isSaving}
                                  >
                                    <RiCloseLine className="size-3.5" />
                                  </Button>
                                </div>
                                {draft.error && (
                                  <div className="
                                    flex items-center gap-1 pl-2 text-xs
                                    text-destructive
                                  "
                                  >
                                    <RiAlertLine className="size-3 shrink-0" />
                                    <span className="truncate" title={draft.error}>{draft.error}</span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
        </DrawerPanel>
        <DrawerFooter>
          <Button
            variant="outline"
            onClick={onDiscardAll}
            disabled={isSaving || drafts.length === 0}
            className="mr-auto"
          >
            <RiCloseLine />
            Discard all
          </Button>
          <DrawerClose render={<Button variant="outline" />}>
            Close
          </DrawerClose>
          <Button
            onClick={onSave}
            disabled={isSaving || drafts.length === 0}
          >
            <LoadingContent loading={isSaving}>
              <RiSaveLine />
              {errorCount > 0 ? 'Retry save' : 'Save all'}
            </LoadingContent>
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}
