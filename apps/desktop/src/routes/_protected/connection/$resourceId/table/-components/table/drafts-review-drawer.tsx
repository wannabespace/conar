import type { TableDraft } from '../../-store'
import { pick } from '@conar/shared/utils/helpers'
import { Badge } from '@conar/ui/components/badge'
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
          max-h-40 overflow-auto rounded-md border bg-muted/30 px-2 py-1
          font-mono text-[0.7rem] wrap-break-word
        `,
        (value === null || value === undefined || value === '') && `
          text-muted-foreground italic
        `,
        className,
      )}
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
        className="max-w-2xl"
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
          {rowEntries.length === 0
            ? (
                <div className="
                  flex h-full min-h-40 items-center justify-center rounded-md
                  border border-dashed
                "
                >
                  <p className="text-sm text-muted-foreground">
                    No row changes to review yet.
                  </p>
                </div>
              )
            : (
                <div className="flex flex-col gap-3">
                  {rowEntries.map(([rowIndex, rowDrafts]) => {
                    const row = rows[rowIndex]
                    const primaryLabel = row && primaryColumns.length > 0
                      ? primaryColumns.map(pc => `${pc} = ${displayFor(pc, row[pc])}`)
                      : [`row #${rowIndex + 1}`]
                    const errors = [...new Set(rowDrafts.map(draft => draft.error).filter(Boolean))] as string[]

                    return (
                      <Frame key={rowIndex}>
                        <FrameHeader className="
                          flex-row items-start justify-between px-3 py-2
                        "
                        >
                          <FrameTitle className="flex items-center gap-2">
                            Row
                            {!!errors.length && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="destructive-info">
                                    <RiAlertLine className="size-3" />
                                    Error
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-lg">
                                  {errors.map(error => (
                                    <div
                                      key={error}
                                      className="flex items-start gap-2"
                                    >
                                      <RiAlertLine className="
                                        mt-0.5 size-3 shrink-0 text-destructive
                                      "
                                      />
                                      {error}
                                    </div>
                                  ))}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-2xs"
                                  onClick={() => removeRow(rowIndex)}
                                  disabled={isSaving}
                                >
                                  <RiArrowGoBackLine />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Discard row</TooltipContent>
                            </Tooltip>
                          </FrameTitle>
                          <FrameDescription className="
                            pt-0.5 font-mono text-[0.7rem]
                          "
                          >
                            {primaryLabel.map(label => (
                              <div key={label} className="truncate" title={label}>
                                {label}
                              </div>
                            ))}
                          </FrameDescription>
                        </FrameHeader>
                        <FramePanel className="p-3">
                          <div className="flex flex-col gap-2.5">
                            {rowDrafts.map((draft) => {
                              const before = row ? displayFor(draft.columnId, row[draft.columnId]) : ''
                              const after = displayFor(draft.columnId, draft.value)

                              return (
                                <div
                                  key={draft.columnId}
                                  className="flex items-start gap-2"
                                >
                                  <div className="
                                    grid flex-1 grid-cols-2 gap-x-2 gap-y-1
                                  "
                                  >
                                    <div className="
                                      truncate font-mono text-[0.7rem]
                                      font-medium text-muted-foreground
                                    "
                                    >
                                      {draft.columnId}
                                    </div>
                                    <div className="
                                      flex items-center gap-1 text-[0.7rem]
                                      font-medium text-muted-foreground
                                    "
                                    >
                                      <RiArrowRightLine className="
                                        size-3 shrink-0
                                      "
                                      />
                                      Modified
                                    </div>
                                    <ValueCell value={row?.[draft.columnId]}>{before}</ValueCell>
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
                                        size="icon-2xs"
                                        onClick={() => removeDraft(rowIndex, draft.columnId)}
                                        disabled={isSaving}
                                        className="mt-6 shrink-0"
                                      >
                                        <RiArrowGoBackLine />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Discard change</TooltipContent>
                                  </Tooltip>
                                </div>
                              )
                            })}
                          </div>
                        </FramePanel>
                      </Frame>
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
