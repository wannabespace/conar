import {
  ArrowDown02Icon,
  ArrowUp02Icon,
  ArrowUpDownIcon,
  Cancel01Icon,
  DeletePutBackIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@tamery/ui/components/command'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import { Skeleton } from '@tamery/ui/components/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { useTableColumnsContext } from '../../../-lib/columns'
import { columnsOrder, useTablePageStore } from '../../../-lib/store'

const SortedItem = ({
  columnId,
  order,
  position,
  onFlip,
  onRemove,
}: {
  columnId: string
  order: 'ASC' | 'DESC'
  position: number | null
  onFlip: () => void
  onRemove: () => void
}) => (
  <CommandItem
    value={columnId}
    keywords={[columnId]}
    className="pr-8"
    onSelect={onFlip}
  >
    {position !== null && (
      <span className="text-2xs text-muted-foreground/70 w-3 shrink-0 tabular-nums">
        {position}
      </span>
    )}
    <span data-mask className="min-w-0 flex-1 truncate">
      {columnId}
    </span>
    <CommandShortcut>
      {order === 'ASC' ? (
        <HugeiconsIcon
          icon={ArrowUp02Icon}
          strokeWidth={2}
          className="size-3"
        />
      ) : (
        <HugeiconsIcon
          icon={ArrowDown02Icon}
          strokeWidth={2}
          className="size-3"
        />
      )}
    </CommandShortcut>
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Remove sort from ${columnId}`}
            tabIndex={-1}
            className="text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive absolute inset-y-0 right-1 my-auto"
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={(event) => {
              event.stopPropagation()
              onRemove()
            }}
          />
        }
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
      </TooltipTrigger>
      <TooltipContent side="top">Remove sort</TooltipContent>
    </Tooltip>
  </CommandItem>
)

export const ActionsOrder = () => {
  const store = useTablePageStore()
  const orderEntries = useSubscription(store, {
    selector: (state) => Object.entries(state.orderBy || {}),
  })
  const { columns, isPending } = useTableColumnsContext()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlighted, setHighlighted] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { setOrder, removeOrder } = columnsOrder(store)

  const keepFocus = (action: () => void) => () => {
    action()
    inputRef.current?.focus()
  }

  const activeCount = orderEntries.length
  const availableColumns =
    columns?.filter((col) => !orderEntries.some(([id]) => id === col.id)) || []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={<Button variant="outline" className="gap-1.5 px-2.5" />}
            />
          }
        >
          <HugeiconsIcon
            icon={ArrowUpDownIcon}
            strokeWidth={2}
            className="text-muted-foreground/60"
          />
          {isPending ? (
            <Skeleton className="h-2.5 w-3 rounded-full" />
          ) : (
            <NumberFlow
              value={activeCount}
              className="text-2xs font-normal tabular-nums"
            />
          )}
        </TooltipTrigger>
        <TooltipContent side="top">
          {isPending && 'Loading columns…'}
          {!isPending &&
            (activeCount > 0
              ? `Sorted by ${activeCount} column${activeCount === 1 ? '' : 's'}`
              : 'Sort order')}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-72 gap-0 p-0" side="bottom" align="end">
        <Command
          value={highlighted}
          onValueChange={setHighlighted}
          onKeyDown={(event) => {
            const removable =
              !search &&
              (event.key === 'Backspace' || event.key === 'Delete') &&
              orderEntries.some(([columnId]) => columnId === highlighted)

            if (removable) {
              event.preventDefault()
              removeOrder(highlighted)
            }
          }}
        >
          <CommandInput
            ref={inputRef}
            value={search}
            onValueChange={setSearch}
            placeholder={activeCount > 0 ? 'Then by…' : 'Sort by…'}
          />
          <CommandList className="max-h-72">
            <CommandEmpty>No columns found.</CommandEmpty>
            {activeCount > 0 && (
              <CommandGroup heading="Sorted">
                {orderEntries.map(([columnId, order], index) => (
                  <SortedItem
                    key={columnId}
                    columnId={columnId}
                    order={order}
                    position={activeCount > 1 ? index + 1 : null}
                    onFlip={keepFocus(() =>
                      setOrder(columnId, order === 'ASC' ? 'DESC' : 'ASC')
                    )}
                    onRemove={keepFocus(() => removeOrder(columnId))}
                  />
                ))}
              </CommandGroup>
            )}
            {availableColumns.length > 0 && (
              <CommandGroup heading={activeCount > 0 ? 'Then by' : 'Columns'}>
                {availableColumns.map((column) => (
                  <CommandItem
                    key={column.id}
                    value={column.id}
                    keywords={[column.id, column.type ?? '']}
                    onSelect={keepFocus(() => setOrder(column.id, 'ASC'))}
                  >
                    <span data-mask className="min-w-0 flex-1 truncate">
                      {column.id}
                    </span>
                    <CommandShortcut>
                      {column.typeLabel || column.type}
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          {activeCount > 0 && (
            <div className="text-muted-foreground/70 text-2xs flex h-6 items-center gap-1.5 border-t px-2 whitespace-nowrap">
              <HugeiconsIcon
                icon={DeletePutBackIcon}
                strokeWidth={2}
                className="size-3 shrink-0"
              />
              removes the highlighted sort
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
