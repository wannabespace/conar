import { ArrowTurnBackwardIcon, SaveIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { pick } from '@tamery/shared/utils'
import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@tamery/ui/components/drawer'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useRef } from 'react'
import { useSubscription } from 'seitu/react'

import { cardClass } from '~/components/card'
import { DiscardButton } from '~/components/discard-button'
import { PaneEmpty } from '~/components/pane-empty'
import { resourceRowsQueryInfiniteOptions } from '~/core/queries/rows/list'
import type { CellPosition } from '~/core/table/cell/cursor'
import type { Draft } from '~/core/table/session'
import {
  draftsActions,
  getRowKeyByPrimaryKeys,
  newRowsActions,
  primaryKeysKey,
  useTableSessionStore,
} from '~/core/table/session'
import { createTransformer } from '~/core/transformers/create-transformer'
import { getDisplayValue } from '~/core/transformers/value-transformer'
import { plural } from '~/lib/plural'

import { useTableColumnsContext } from '../../lib/columns'
import { useTablePageStore } from '../../lib/store'
import { ChangeList, DraftChange, NewRowValues } from './draft-changes'
import { tableGridRef } from './table'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const DraftsReviewDrawer = ({
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
}) => {
  const { connection, connectionResource } = useRouteContext()
  const { columns } = useTableColumnsContext()
  const columnsById = new Map(columns.map((column) => [column.id, column]))
  const primaryColumns = columns.filter((c) => c.primaryKey).map((c) => c.id)
  const store = useTablePageStore()
  const sessionStore = useTableSessionStore()
  const drafts = useSubscription(sessionStore, {
    selector: (state) => Object.values(state.drafts),
  })
  const newRows = useSubscription(sessionStore, {
    selector: (state) => state.newRows,
  })
  const changeCount = drafts.length + newRows.length
  const { filters, orderBy } = useSubscription(store, {
    selector: (state) => pick(state, ['filters', 'orderBy']),
  })
  const { remove: removeDraft, removeRow } = draftsActions(sessionStore)
  const listRef = useRef<HTMLDivElement>(null)
  const jumpTarget = useRef<CellPosition | null>(null)

  const { data: rows = [] } = useInfiniteQuery(
    resourceRowsQueryInfiniteOptions({
      connectionResource,
      query: { filters, orderBy },
      schema,
      table,
    })
  )

  const rowsByPrimaryKey = new Map(
    rows.map(
      (row, index) =>
        [
          getRowKeyByPrimaryKeys(row, primaryColumns),
          { index: newRows.length + index, row },
        ] as const
    )
  )
  const rowIndex = ([firstDraft]: Draft[]) =>
    (firstDraft &&
      rowsByPrimaryKey.get(primaryKeysKey(firstDraft.primaryKeys))?.index) ??
    Number.MAX_SAFE_INTEGER
  const groups = [
    ...Map.groupBy(drafts, (d) => primaryKeysKey(d.primaryKeys)),
  ].toSorted(([, a], [, b]) => rowIndex(a) - rowIndex(b))

  const columnDisplay = (columnId: string, value: unknown) => {
    const column = columnsById.get(columnId)

    if (!column) {
      return getDisplayValue(value, Number.POSITIVE_INFINITY)
    }

    return createTransformer(connection.type, column).toDisplay(
      value,
      Number.POSITIVE_INFINITY
    )
  }

  const jump = (position: CellPosition) => {
    jumpTarget.current = position
    onOpenChange(false)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection="right"
      size="sm"
    >
      <DrawerContent
        className="w-lg"
        initialFocus={() =>
          listRef.current?.querySelector<HTMLElement>('[data-change]') ?? true
        }
        finalFocus={() => {
          const target = jumpTarget.current
          jumpTarget.current = null
          if (!target) {
            return true
          }
          tableGridRef.current?.reveal(target)
          return false
        }}
      >
        <DrawerHeader>
          <DrawerTitle>Review changes</DrawerTitle>
          <DrawerDescription>
            {plural(changeCount, 'change')} in{' '}
            <span data-mask className="font-mono">
              {schema}.{table}
            </span>
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-auto p-3">
          {changeCount === 0 ? (
            <PaneEmpty
              icon={SaveIcon}
              title="Nothing to review"
              description="Edit cells in the table and the changes will show up here."
            />
          ) : (
            <ChangeList listRef={listRef} isSaving={isSaving}>
              {newRows.map((newRow, index) => (
                <div
                  key={newRow.id}
                  className={cn(cardClass, 'overflow-hidden')}
                >
                  <header className="border-foreground/6 flex h-9 items-center gap-2 border-b pr-1.5 pl-3">
                    <span className="text-2xs text-foreground flex-1">
                      New row
                    </span>
                    <DiscardButton
                      label="Discard row"
                      onClick={() =>
                        newRowsActions(sessionStore).remove(newRow.id)
                      }
                      disabled={isSaving}
                    />
                  </header>
                  <NewRowValues
                    columns={columns}
                    display={columnDisplay}
                    newRow={newRow}
                    onJump={(column) => jump({ column, row: index })}
                  />
                </div>
              ))}
              {groups.map(([key, rowDrafts]) => {
                const primaryKeys = rowDrafts[0]?.primaryKeys ?? {}
                const loaded = rowsByPrimaryKey.get(key)
                const rowLabel = Object.entries(primaryKeys)
                  .map(
                    ([columnId, value]) =>
                      `${columnId} = ${columnDisplay(columnId, value)}`
                  )
                  .join(' · ')

                return (
                  <div key={key} className={cn(cardClass, 'overflow-hidden')}>
                    <header className="border-foreground/6 flex h-9 items-center gap-2 border-b pr-1.5 pl-3">
                      <span
                        data-mask
                        title={rowLabel}
                        className="text-2xs text-foreground min-w-0 flex-1 truncate font-mono"
                      >
                        {rowLabel}
                      </span>
                      <DiscardButton
                        label="Discard row"
                        onClick={() => removeRow(primaryKeys)}
                        disabled={isSaving}
                      />
                    </header>
                    {rowDrafts.map((draft) => {
                      const original = loaded?.row[draft.columnId]
                      return (
                        <DraftChange
                          key={draft.columnId}
                          column={columnsById.get(draft.columnId)}
                          draft={draft}
                          isSaving={isSaving}
                          before={{
                            display: loaded
                              ? columnDisplay(draft.columnId, original)
                              : '',
                            value: original,
                          }}
                          after={{
                            display: columnDisplay(draft.columnId, draft.value),
                            value: draft.value,
                          }}
                          onJump={() =>
                            loaded &&
                            jump({ column: draft.columnId, row: loaded.index })
                          }
                          onDiscard={
                            rowDrafts.length > 1
                              ? () => removeDraft(primaryKeys, draft.columnId)
                              : undefined
                          }
                        />
                      )
                    })}
                  </div>
                )
              })}
            </ChangeList>
          )}
        </div>
        <DrawerFooter>
          <Button
            variant="ghost-muted"
            onClick={onDiscardAll}
            disabled={isSaving || changeCount === 0}
            className="mr-auto"
          >
            <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} />
            Discard all
          </Button>
          <DrawerClose render={<Button variant="outline">Close</Button>} />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  onClick={onSave}
                  disabled={isSaving || changeCount === 0}
                />
              }
            >
              <LoadingContent loading={isSaving}>
                Save {plural(changeCount, 'change')}
              </LoadingContent>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-0.5">
                <span>Save in one transaction</span>
                <KbdCtrlLetter userAgent={navigator.userAgent} letter="S" />
              </div>
            </TooltipContent>
          </Tooltip>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
