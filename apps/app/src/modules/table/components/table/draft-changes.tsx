import { Alert02Icon, ArrowRight02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkeys } from '@tanstack/react-hotkeys'
import type { ReactNode, RefObject } from 'react'

import { DiscardButton } from '~/components/discard-button'
import type { Column } from '~/core/table/cell/utils'
import type { Draft, NewRow } from '~/core/table/session'
import {
  draftKey,
  draftsActions,
  useTableSessionStore,
} from '~/core/table/session'

import { ColumnType } from './column-type'

interface ShownValue {
  display: string
  value: unknown
}

const emptyText = (value: unknown) =>
  value === undefined ? 'default' : String(value ?? 'null') || 'empty'

const Value = ({
  className,
  display,
  value,
}: ShownValue & { className?: string }) => {
  const isEmpty = value === null || value === undefined || value === ''

  return (
    <span
      data-mask
      title={display}
      className={cn(
        'line-clamp-3 min-w-0 wrap-break-word',
        isEmpty && 'text-muted-foreground italic',
        className
      )}
    >
      {isEmpty ? emptyText(value) : display}
    </span>
  )
}

const ChangeError = ({ error }: { error: string }) => (
  <span className="text-2xs text-destructive flex items-start gap-1">
    <HugeiconsIcon
      icon={Alert02Icon}
      strokeWidth={2}
      className="mt-px size-3 shrink-0"
    />
    {error}
  </span>
)

const ChangeLabel = ({
  column,
  id,
}: {
  column: Column | undefined
  id: string
}) => (
  <span className="flex min-w-0 items-center gap-2">
    <span
      data-mask
      className="text-2xs text-muted-foreground truncate font-mono"
    >
      {id}
    </span>
    {column?.typeLabel && <ColumnType column={column} />}
  </span>
)

export const DraftChange = ({
  after,
  before,
  column,
  draft,
  isSaving,
  onDiscard,
  onJump,
}: {
  after: ShownValue
  before: ShownValue
  column: Column | undefined
  draft: Draft
  isSaving: boolean
  onDiscard?: () => void
  onJump: () => void
}) => (
  <div className="group/change border-foreground/6 relative border-b last:border-b-0">
    <button
      type="button"
      data-change={draftKey(draft.primaryKeys, draft.columnId)}
      onClick={onJump}
      className={cn(
        'group-hover/change:bg-accent focus-visible:bg-accent flex w-full flex-col gap-1 px-3 py-2 text-left outline-none',
        onDiscard && 'pr-9'
      )}
    >
      <ChangeLabel id={draft.columnId} column={column} />
      <span className="flex items-start gap-2 text-xs">
        <Value {...before} className="text-muted-foreground line-through" />
        <HugeiconsIcon
          icon={ArrowRight02Icon}
          strokeWidth={2}
          className="text-muted-foreground mt-0.5 size-3 shrink-0"
        />
        <Value {...after} />
      </span>
      {draft.error && <ChangeError error={draft.error} />}
    </button>
    {onDiscard && (
      <DiscardButton
        label="Discard change"
        className="absolute top-1.5 right-1.5"
        onClick={onDiscard}
        disabled={isSaving}
      />
    )}
  </div>
)

export const NewRowValues = ({
  columns,
  display,
  newRow,
  onJump,
}: {
  columns: Column[]
  display: (columnId: string, value: unknown) => string
  newRow: NewRow
  onJump: (columnId: string) => void
}) => (
  <>
    {columns
      .filter((column) => newRow.values[column.id] !== undefined)
      .map((column) => {
        const value = newRow.values[column.id]
        return (
          <button
            key={column.id}
            type="button"
            data-change={`${newRow.id}:${column.id}`}
            onClick={() => onJump(column.id)}
            className="hover:bg-accent focus-visible:bg-accent border-foreground/6 flex w-full flex-col gap-1 border-b px-3 py-2 text-left outline-none last:border-b-0"
          >
            <ChangeLabel id={column.id} column={column} />
            <Value
              className="text-xs"
              display={display(column.id, value)}
              value={value}
            />
          </button>
        )
      })}
    {newRow.error && (
      <div className="px-3 py-2">
        <ChangeError error={newRow.error} />
      </div>
    )}
  </>
)

export const ChangeList = ({
  children,
  isSaving,
  listRef,
}: {
  children: ReactNode
  isSaving: boolean
  listRef: RefObject<HTMLDivElement | null>
}) => {
  const sessionStore = useTableSessionStore()
  const { remove } = draftsActions(sessionStore)

  const focused = () => {
    const buttons = [
      ...(listRef.current?.querySelectorAll<HTMLElement>('[data-change]') ??
        []),
    ]
    return {
      buttons,
      index: buttons.indexOf(document.activeElement as HTMLElement),
    }
  }
  const move = (step: number) => {
    const { buttons, index } = focused()
    buttons[Math.min(Math.max(index + step, 0), buttons.length - 1)]?.focus()
  }
  const discard = () => {
    const { buttons, index } = focused()
    const draft =
      sessionStore.get().drafts[buttons[index]?.dataset.change ?? '']
    if (!draft) {
      return
    }
    ;(buttons[index + 1] ?? buttons[index - 1])?.focus()
    remove(draft.primaryKeys, draft.columnId)
  }

  useHotkeys(
    [
      { callback: () => move(1), hotkey: 'ArrowDown' },
      { callback: () => move(-1), hotkey: 'ArrowUp' },
      {
        callback: discard,
        hotkey: 'Backspace',
        options: { enabled: !isSaving },
      },
    ],
    { target: listRef }
  )

  return (
    <div ref={listRef} className="flex flex-col gap-3">
      {children}
    </div>
  )
}
