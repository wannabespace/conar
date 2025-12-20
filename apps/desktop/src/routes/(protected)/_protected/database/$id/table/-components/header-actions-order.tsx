import type { databases } from '~/drizzle'
import { omit } from '@conar/shared/utils/helpers'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@conar/ui/components/command'
import { Indicator } from '@conar/ui/components/custom/indicator'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Separator } from '@conar/ui/components/separator'
import { ToggleGroup, ToggleGroupItem } from '@conar/ui/components/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@conar/ui/components/tooltip'
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowUpDownLine,
  RiArrowUpLine,
  RiCloseLine,
} from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useState } from 'react'
import { useTableColumns } from '../-queries/use-columns-query'
import { usePageStoreContext } from '../-store'

export function useHeaderActionsOrder() {
  const store = usePageStoreContext()

  const setOrder = (columnId: string, order: 'ASC' | 'DESC') => {
    store.setState(
      (state) =>
        ({
          ...state,
          orderBy: {
            ...state.orderBy,
            [columnId]: order,
          },
        }) satisfies typeof state
    )
  }

  const removeOrder = (columnId: string) => {
    store.setState(
      (state) =>
        ({
          ...state,
          orderBy: omit(state.orderBy, [columnId]),
        }) satisfies typeof state
    )
  }

  const onOrder = (columnId: string) => {
    const currentOrder = store.state.orderBy?.[columnId]

    if (currentOrder === 'ASC') {
      setOrder(columnId, 'DESC')
    } else if (currentOrder === 'DESC') {
      removeOrder(columnId)
    } else {
      setOrder(columnId, 'ASC')
    }
  }

  return {
    setOrder,
    removeOrder,
    onOrder,
  }
}

export function HeaderActionsOrder({
  table,
  schema,
  database,
}: {
  table: string
  schema: string
  database: typeof databases.$inferSelect
}) {
  const store = usePageStoreContext()
  const orderEntries = useStore(store, (state) => Object.entries(state.orderBy || {}))
  const columns = useTableColumns({ database, table, schema })
  const [open, setOpen] = useState(false)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const { setOrder, removeOrder } = useHeaderActionsOrder()

  const addColumn = (columnId: string) => {
    setOrder(columnId, 'ASC')
    setShowAddColumn(false)
  }

  const hasOrders = orderEntries.length > 0
  const availableColumns =
    columns?.filter((col) => !orderEntries.some(([id]) => id === col.id)) || []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Sort order">
                <RiArrowUpDownLine />
                {hasOrders && <Indicator />}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">Sort order</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-90 p-0" side="bottom" align="end">
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiArrowUpDownLine className="size-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Sort Order</h4>
              </div>
              {hasOrders && (
                <Badge variant="secondary" className="text-xs">
                  {orderEntries.length} {orderEntries.length === 1 ? 'column' : 'columns'}
                </Badge>
              )}
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
            {orderEntries.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center">
                  <RiArrowUpDownLine className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">No sorting applied</p>
                  <p className="text-xs text-muted-foreground">
                    Click on column headers or add columns below
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {orderEntries.map(([columnId, order]) => (
                  <div key={columnId} className="group relative">
                    <div className="flex items-center gap-3">
                      <p className="flex-1 text-sm truncate" title={columnId}>
                        {columnId}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <ToggleGroup
                          type="single"
                          variant="outline"
                          size="xs"
                          value={order}
                          onValueChange={(value) => {
                            if (value) setOrder(columnId, value as 'ASC' | 'DESC')
                          }}
                        >
                          <ToggleGroupItem
                            value="ASC"
                            aria-label="Sort ascending"
                            className="text-xs px-1.5 gap-1"
                          >
                            <RiArrowUpLine className="size-3.5" />
                            ASC
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="DESC"
                            aria-label="Sort descending"
                            className="text-xs px-1.5 gap-1"
                          >
                            <RiArrowDownLine className="size-3.5" />
                            DESC
                          </ToggleGroupItem>
                        </ToggleGroup>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeOrder(columnId)}
                          aria-label={`Remove sort from ${columnId}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <RiCloseLine className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {availableColumns.length > 0 && (
            <>
              <Separator />
              <div className="p-3">
                <Popover open={showAddColumn} onOpenChange={setShowAddColumn}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                      <RiAddLine className="size-4" />
                      Add column to sort
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-64" align="start" side="left">
                    <Command>
                      <CommandInput placeholder="Search columns..." />
                      <CommandList>
                        <CommandEmpty>No columns found.</CommandEmpty>
                        <CommandGroup>
                          {availableColumns.map((column) => (
                            <CommandItem
                              key={column.id}
                              value={column.id}
                              onSelect={() => addColumn(column.id)}
                              className="gap-2"
                            >
                              <span className="truncate">{column.id}</span>
                              {column.type && (
                                <span className="ml-auto text-xs text-muted-foreground text-right">
                                  {column.type}
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
