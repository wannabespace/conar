import {
  Cancel01Icon,
  DragDropVerticalIcon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { FieldError } from '@tamery/ui/components/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@tamery/ui/components/input-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { Reorder, useDragControls } from 'motion/react'
import * as React from 'react'

export interface EditableListItem {
  id: string
  value: string
}

const REORDER_TRANSITION = {
  duration: 0.2,
  ease: [0.32, 0.72, 0, 1],
} as const

const createItem = (value = ''): EditableListItem => ({
  id: crypto.randomUUID(),
  value,
})

const splitPasted = (text: string) =>
  text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)

const duplicatesOf = (items: EditableListItem[]) => {
  const values = items.map((item) => item.value.trim()).filter(Boolean)

  return new Set(
    values.filter((value, index) => values.indexOf(value) !== index)
  )
}

const EditableListRow = ({
  canRemove,
  error,
  index,
  item,
  onChange,
  onDragCommit,
  onInsert,
  onMove,
  onNavigate,
  onPasteValues,
  onRemove,
  placeholder,
  readOnly,
}: {
  canRemove: boolean
  error: string | undefined
  index: number
  item: EditableListItem
  onChange: (value: string) => void
  onDragCommit: () => void
  onInsert: () => void
  onMove: (delta: number) => void
  onNavigate: (delta: number) => void
  onPasteValues: (values: string[]) => void
  onRemove: () => void
  placeholder: string
  readOnly: boolean
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)
  const dragControls = useDragControls()
  const draggable = !readOnly

  useHotkeys(
    [
      { callback: onInsert, hotkey: 'Enter' },
      { callback: () => onNavigate(-1), hotkey: 'ArrowUp' },
      { callback: () => onNavigate(1), hotkey: 'ArrowDown' },
      {
        callback: () => onMove(-1),
        hotkey: 'Alt+ArrowUp',
        options: { enabled: draggable },
      },
      {
        callback: () => onMove(1),
        hotkey: 'Alt+ArrowDown',
        options: { enabled: draggable },
      },
      {
        callback: (event) => {
          if (item.value !== '' || !canRemove) {
            return
          }
          event.preventDefault()
          onRemove()
        },
        hotkey: 'Backspace',
        options: { preventDefault: false },
      },
      { callback: () => inputRef.current?.blur(), hotkey: 'Escape' },
    ],
    { enabled: !readOnly, ignoreInputs: false, target: inputRef }
  )

  return (
    <Reorder.Item
      value={item.id}
      data-item={item.id}
      drag={draggable ? 'y' : false}
      dragControls={dragControls}
      dragListener={false}
      layout="position"
      transition={{ layout: REORDER_TRANSITION }}
      className={cn(
        'relative',
        dragging && 'bg-input z-10 rounded-xl shadow-lg'
      )}
      onDragEnd={() => {
        setDragging(false)
        onDragCommit()
      }}
      onDragStart={() => setDragging(true)}
    >
      <InputGroup variant="flat">
        {draggable && (
          <InputGroupAddon>
            <Tooltip>
              <TooltipTrigger
                render={
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={`Reorder item ${index + 1}`}
                    onPointerDown={(event) => dragControls.start(event)}
                  >
                    <HugeiconsIcon
                      icon={DragDropVerticalIcon}
                      strokeWidth={2}
                    />
                  </InputGroupButton>
                }
              />
              <TooltipContent>Drag to reorder · ⌥↑ ⌥↓</TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        )}
        <InputGroupInput
          ref={inputRef}
          data-mask
          aria-invalid={!!error}
          aria-label={`${placeholder} ${index + 1}`}
          autoComplete="off"
          disabled={readOnly}
          placeholder={placeholder}
          spellCheck={false}
          value={item.value}
          onChange={(event) => onChange(event.target.value)}
          onPaste={(event) => {
            const pasted = splitPasted(event.clipboardData.getData('text'))

            if (pasted.length < 2) {
              return
            }
            event.preventDefault()
            onPasteValues(pasted)
          }}
        />
        {(error || (!readOnly && canRemove)) && (
          <InputGroupAddon align="inline-end">
            <FieldError>{error}</FieldError>
            {!readOnly && canRemove && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <InputGroupButton
                      size="icon-xs"
                      aria-label={`Remove item ${index + 1}`}
                      className="opacity-0 transition-opacity group-focus-within/input-group:opacity-100 group-hover/input-group:opacity-100 focus-visible:opacity-100"
                      onClick={onRemove}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                    </InputGroupButton>
                  }
                />
                <TooltipContent>Remove · ⌫</TooltipContent>
              </Tooltip>
            )}
          </InputGroupAddon>
        )}
      </InputGroup>
    </Reorder.Item>
  )
}

export const EditableList = ({
  addLabel = 'Add item',
  canRemoveItem,
  error,
  items,
  onItemsChange,
  placeholder = 'Value',
  readOnly = false,
}: {
  addLabel?: string
  canRemoveItem?: (item: EditableListItem, index: number) => boolean
  error?: string | undefined
  items: EditableListItem[]
  onItemsChange: (items: EditableListItem[]) => void
  placeholder?: string
  readOnly?: boolean
}) => {
  const listRef = React.useRef<HTMLUListElement>(null)
  const pendingFocusId = React.useRef<string | null>(null)
  // A drag paints many orders before it lands; callers see only the drop.
  const [dragOrder, setDragOrder] = React.useState<EditableListItem[] | null>(
    null
  )
  const rows = dragOrder ?? items
  const duplicates = duplicatesOf(items)
  const listError = duplicates.size ? undefined : error

  const focusRow = (id: string | undefined) => {
    const input = listRef.current?.querySelector<HTMLInputElement>(
      `[data-item="${id}"] input`
    )

    if (input) {
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    }
  }

  React.useLayoutEffect(() => {
    if (pendingFocusId.current) {
      focusRow(pendingFocusId.current)
      pendingFocusId.current = null
    }
  })

  const replace = (next: EditableListItem[], focusId?: string) => {
    onItemsChange(next)
    pendingFocusId.current = focusId ?? null
  }

  const insertAt = (index: number) => {
    const item = createItem()

    replace([...rows.slice(0, index), item, ...rows.slice(index)], item.id)
  }

  const pasteAt = (index: number, [first, ...rest]: string[]) => {
    const added = rest.map(createItem)
    const filled = rows.map((entry, position) =>
      position === index ? { ...entry, value: first ?? entry.value } : entry
    )

    replace(
      [...filled.slice(0, index + 1), ...added, ...filled.slice(index + 1)],
      added.at(-1)?.id
    )
  }

  const removeAt = (index: number) => {
    const neighbour = rows[index - 1] ?? rows[index + 1]

    replace(
      rows.filter((_, position) => position !== index),
      neighbour?.id
    )
  }

  const moveBy = (index: number, delta: number) => {
    const item = rows[index]
    const target = index + delta

    if (!item || target < 0 || target >= rows.length) {
      return
    }
    const next = rows.filter((_, position) => position !== index)

    next.splice(target, 0, item)
    replace(next, item.id)
  }

  const reorder = (nextIds: string[]) => {
    const byId = new Map(rows.map((item) => [item.id, item]))

    setDragOrder(nextIds.flatMap((id) => byId.get(id) ?? []))
  }

  const commitOrder = () => {
    if (!dragOrder) {
      return
    }
    onItemsChange(dragOrder)
    setDragOrder(null)
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {rows.length > 0 && (
        <div
          data-invalid={listError ? true : undefined}
          className="bg-input ring-foreground/4 data-invalid:invalid-ring w-full divide-y rounded-xl shadow-xs ring"
        >
          <Reorder.Group
            ref={listRef}
            axis="y"
            values={rows.map((item) => item.id)}
            onReorder={reorder}
            className="divide-y"
          >
            {rows.map((item, index) => (
              <EditableListRow
                key={item.id}
                canRemove={
                  rows.length > 1 && (canRemoveItem?.(item, index) ?? true)
                }
                error={duplicates.has(item.value.trim()) ? error : undefined}
                index={index}
                item={item}
                placeholder={placeholder}
                readOnly={readOnly}
                onChange={(value) =>
                  onItemsChange(
                    rows.map((entry) =>
                      entry.id === item.id ? { ...entry, value } : entry
                    )
                  )
                }
                onDragCommit={commitOrder}
                onInsert={() => insertAt(index + 1)}
                onMove={(delta) => moveBy(index, delta)}
                onNavigate={(delta) => focusRow(rows[index + delta]?.id)}
                onPasteValues={(values) => pasteAt(index, values)}
                onRemove={() => removeAt(index)}
              />
            ))}
          </Reorder.Group>
        </div>
      )}
      <div className="flex items-center gap-2">
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertAt(rows.length)}
          >
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
            {addLabel}
          </Button>
        )}
        <FieldError>{listError}</FieldError>
      </div>
    </div>
  )
}
