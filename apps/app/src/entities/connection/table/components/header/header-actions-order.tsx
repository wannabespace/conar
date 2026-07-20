import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowUpDownLine,
  RiArrowUpLine,
  RiCloseLine,
} from '@remixicon/react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@tamery/ui/components/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { useTableColumns } from '../../columns'
import { columnsOrder, useTablePageStore } from '../../store'

function DirectionToggle({
  order,
  onChange,
}: {
  order: 'ASC' | 'DESC'
  onChange: (order: 'ASC' | 'DESC') => void
}) {
  return (
    <div
      className="
        flex h-6 shrink-0 items-stretch overflow-hidden rounded-md border
        bg-input shadow-2xs
      "
    >
      {(['ASC', 'DESC'] as const).map((direction, index) => (
        <button
          key={direction}
          type="button"
          aria-label={direction === 'ASC' ? 'Sort ascending' : 'Sort descending'}
          aria-pressed={order === direction}
          className={cn(
            `
              flex w-6 cursor-default items-center justify-center outline-none
              focus-visible:bg-accent
            `,
            index === 1 && 'border-l',
            order === direction
              ? 'bg-primary text-primary-foreground'
              : `
                text-muted-foreground
                hover:bg-accent hover:text-foreground
              `,
          )}
          onClick={() => onChange(direction)}
        >
          {direction === 'ASC' ? (
            <RiArrowUpLine className="size-3.5" />
          ) : (
            <RiArrowDownLine className="size-3.5" />
          )}
        </button>
      ))}
    </div>
  )
}

export function HeaderActionsOrder() {
  const store = useTablePageStore()
  const orderEntries = useSubscription(store, {
    selector: state => Object.entries(state.orderBy || {}),
  })
  const columns = useTableColumns()
  const [open, setOpen] = useState(false)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const { setOrder, removeOrder } = columnsOrder(store)

  const addColumn = (columnId: string) => {
    setOrder(columnId, 'ASC')
    setShowAddColumn(false)
  }

  const activeCount = orderEntries.length
  const availableColumns = columns?.filter(col => !orderEntries.some(([id]) => id === col.id)) || []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button size="icon" variant="outline" className="relative overflow-visible" />
              }
            />
          }
        >
          <RiArrowUpDownLine />
          {activeCount > 0 && (
            <span
              className={`
                absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center
                justify-center rounded-full bg-primary px-1 text-2xs
                font-medium text-primary-foreground tabular-nums
              `}
            >
              {activeCount}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent side="top">
          {activeCount > 0
            ? `Sorted by ${activeCount} column${activeCount === 1 ? '' : 's'}`
            : 'Sort order'}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-64 gap-0 rounded-2xl p-1" side="bottom" align="end">
        <div
          className="
            px-2 pt-1.5 pb-1 text-2xs font-semibold tracking-wider
            text-muted-foreground uppercase select-none
          "
        >
          Sorted by
        </div>
        {orderEntries.length === 0 ? (
          <p className="px-2 pt-0.5 pb-2 text-xs text-muted-foreground">
            Not sorted. Add a column below or use a column header menu.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {orderEntries.map(([columnId, order], index) => (
              <div
                key={columnId}
                className="
                  group flex h-7 items-center gap-2 rounded-md px-2
                  hover:bg-accent/50
                "
              >
                <span
                  className="
                    w-3 shrink-0 text-right text-2xs text-muted-foreground
                    tabular-nums select-none
                  "
                >
                  {index + 1}
                </span>
                <span data-mask className="min-w-0 flex-1 truncate text-sm">
                  {columnId}
                </span>
                <DirectionToggle order={order} onChange={next => setOrder(columnId, next)} />
                <button
                  type="button"
                  aria-label={`Remove sort from ${columnId}`}
                  className="
                    flex size-5 shrink-0 cursor-default items-center
                    justify-center rounded text-muted-foreground opacity-0
                    transition-opacity outline-none
                    group-hover:opacity-100
                    hover:text-destructive
                    focus-visible:bg-accent focus-visible:opacity-100
                  "
                  onClick={() => removeOrder(columnId)}
                >
                  <RiCloseLine className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {availableColumns.length > 0 && (
          <div className="mt-1 border-t pt-1">
            <Popover open={showAddColumn} onOpenChange={setShowAddColumn}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    aria-label="Add column to sort"
                    className="
                      flex h-7 w-full cursor-default items-center gap-2
                      rounded-md px-2 text-sm text-muted-foreground
                      outline-none
                      hover:bg-accent/50 hover:text-foreground
                      focus-visible:bg-accent
                    "
                  />
                }
              >
                <RiAddLine className="size-4" />
                Add column…
              </PopoverTrigger>
              <PopoverContent
                className="
                  w-64 p-0
                  **:data-[slot=popover-viewport]:p-0
                "
                align="end"
                side="bottom"
              >
                <Command>
                  <CommandInput placeholder="Search columns..." />
                  <CommandList>
                    <CommandEmpty>No columns found.</CommandEmpty>
                    <CommandGroup>
                      {availableColumns.map(column => (
                        <CommandItem
                          key={column.id}
                          value={column.id}
                          onSelect={() => addColumn(column.id)}
                          className="gap-2"
                        >
                          <span data-mask className="min-w-0 flex-1 truncate">
                            {column.id}
                          </span>
                          {column.type && (
                            <CommandShortcut className="tracking-normal">
                              {column.type}
                            </CommandShortcut>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
