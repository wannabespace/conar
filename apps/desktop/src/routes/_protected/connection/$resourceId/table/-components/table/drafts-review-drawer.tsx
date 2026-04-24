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
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@conar/ui/components/frame'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiAlertLine, RiArrowGoBackLine, RiArrowRightLine, RiSaveLine } from '@remixicon/react'
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
  return (
    <div
      className={cn(
        `
          min-w-0 flex-1 rounded-md border bg-muted/30 px-2 py-1 font-mono
          text-[11px]/4 wrap-break-word
        `,
        (value === null || value === undefined || value === '') && `
          text-muted-foreground italic
        `,
        className,
      )}
      title={children}
    >
      <span className="line-clamp-2 min-h-10">{children}</span>
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
            change
            {drafts.length === 1 ? '' : 's'}
            {' '}
            in
            {' '}
            <span className="font-medium">
              {schema}
              .
              {table}
            </span>
          </DrawerDescription>
        </DrawerHeader>
        <DrawerPanel>
          <div className="flex flex-col gap-3">
            {rowEntries.map(([rowIndex, rowDrafts]) => {
              const row = rows[rowIndex]
              const primaryLabel = row && primaryColumns.length > 0
                ? primaryColumns.map(pc => `${pc}: ${displayFor(pc, row[pc])}`)
                : [`row #${rowIndex + 1}`]

              return (
                <Frame key={rowIndex}>
                  <FrameHeader>
                    <div className="flex items-start justify-between gap-2">
                      <FrameTitle>
                        Row
                        {rowDrafts.some(draft => draft.error) && (
                          <span className="
                            inline-flex items-center gap-1 rounded-full
                            bg-destructive/10 px-1.5 py-0.5 text-[10px]
                            font-medium text-destructive
                          "
                          >
                            <RiAlertLine className="size-3" />
                            Error
                          </span>
                        )}
                      </FrameTitle>
                      <FrameDescription className="font-mono text-[11px]">
                        {primaryLabel.map(label => (
                          <div key={label} className="truncate" title={label}>
                            {label}
                          </div>
                        ))}
                      </FrameDescription>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeRow(rowIndex)}
                          disabled={isSaving}
                        >
                          <RiArrowGoBackLine />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Discard row</TooltipContent>
                    </Tooltip>
                  </FrameHeader>
                  <FramePanel>
                    <div className="flex flex-col gap-2.5">
                      {rowDrafts.map((draft) => {
                        const before = row ? displayFor(draft.columnId, row[draft.columnId]) : 'unavailable'
                        const after = displayFor(draft.columnId, draft.value)

                        return (
                          <div key={draft.columnId}>
                            <div className="
                              grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]
                              items-start gap-2
                            "
                            >
                              <div className="min-w-0 space-y-1">
                                <div className="
                                  truncate font-mono text-[10px] font-semibold
                                  text-muted-foreground uppercase
                                "
                                >
                                  {draft.columnId}
                                </div>
                                <ValueCell value={row?.[draft.columnId]}>{before}</ValueCell>
                              </div>

                              <div className="min-w-0 space-y-1">
                                <div className="
                                  flex items-center gap-1 text-[10px]
                                  font-medium text-muted-foreground uppercase
                                "
                                >
                                  <RiArrowRightLine className="size-3 shrink-0" />
                                  Modified
                                </div>
                                <ValueCell
                                  value={draft.value}
                                  className="
                                    border-warning/30 bg-warning/10
                                    text-warning-foreground
                                  "
                                >
                                  {after}
                                </ValueCell>
                              </div>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => removeDraft(rowIndex, draft.columnId)}
                                    disabled={isSaving}
                                    className="mt-5 shrink-0"
                                  >
                                    <RiArrowGoBackLine className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">Discard change</TooltipContent>
                              </Tooltip>
                            </div>

                            {draft.error && (
                              <div className="
                                mt-2 flex items-start gap-2 rounded-md border
                                border-destructive/20 bg-destructive/5 px-2.5
                                py-2 text-xs text-destructive
                              "
                              >
                                <RiAlertLine className="mt-0.5 size-3 shrink-0" />
                                <span title={draft.error}>{draft.error}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </FramePanel>
                </Frame>
              )
            })}
          </div>
        </DrawerPanel>
        <DrawerFooter>
          <Button
            variant="outline"
            onClick={onDiscardAll}
            disabled={isSaving || drafts.length === 0}
            className="mr-auto"
          >
            <RiArrowGoBackLine />
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
