import type { connections } from '~/drizzle'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@conar/ui/components/command'
import { Indicator } from '@conar/ui/components/custom/indicator'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Separator } from '@conar/ui/components/separator'
import { ToggleGroup, ToggleGroupItem } from '@conar/ui/components/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiAddLine, RiArrowDownLine, RiArrowUpDownLine, RiArrowUpLine, RiCloseLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useState } from 'react'
import { useTableColumns } from '../-queries/use-columns-query'
import { usePageStoreContext } from '../-store'
import { useHeaderActionsOrder } from './use-header-actions-order'

export { useHeaderActionsOrder } from './use-header-actions-order'

export function HeaderActionsOrder({ table, schema, connection }: { table: string, schema: string, connection: typeof connections.$inferSelect }) {
  const store = usePageStoreContext()
  const orderEntries = useStore(store, state => Object.entries(state.orderBy || {}))
  const columns = useTableColumns({ connection, table, schema })
  const [open, setOpen] = useState(false)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const { setOrder, removeOrder } = useHeaderActionsOrder()

  const addColumn = (columnId: string) => {
    setOrder(columnId, 'ASC')
    setShowAddColumn(false)
  }

  const hasOrders = orderEntries.length > 0
  const availableColumns = columns?.filter(col => !orderEntries.some(([id]) => id === col.id)) || []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Sort order"
              >
                <RiArrowUpDownLine />
                {hasOrders && <Indicator />}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            Sort order
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-90 p-0" side="bottom" align="end">
        <div className="flex flex-col">
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RiArrowUpDownLine className="size-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Sort Order</h4>
              </div>
              {hasOrders && (
                <Badge variant="secondary" className="text-xs">
                  {orderEntries.length}
                  {' '}
                  {orderEntries.length === 1 ? 'column' : 'columns'}
                </Badge>
              )}
            </div>
          </div>

          <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
            {orderEntries.length === 0
              ? (
                  <div className="space-y-2 py-8 text-center">
                    <div className="
                      mx-auto flex size-12 items-center justify-center
                      rounded-full bg-muted
                    "
                    >
                      <RiArrowUpDownLine className="
                        size-6 text-muted-foreground
                      "
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">No sorting applied</p>
                      <p className="text-xs text-muted-foreground">
                        Click on column headers or add columns below
                      </p>
                    </div>
                  </div>
                )
              : (
                  <div className="space-y-2">
                    {orderEntries.map(([columnId, order]) => (
                      <div
                        key={columnId}
                        className="group relative"
                      >
                        <div className="flex items-center gap-3">
                          <p className="flex-1 truncate text-sm" title={columnId}>
                            {columnId}
                          </p>
                          <div className="flex shrink-0 items-center gap-2">
                            <ToggleGroup
                              type="single"
                              variant="outline"
                              size="xs"
                              value={order}
                              onValueChange={(value) => {
                                if (value)
                                  setOrder(columnId, value as 'ASC' | 'DESC')
                              }}
                            >
                              <ToggleGroupItem
                                value="ASC"
                                aria-label="Sort ascending"
                                className="gap-1 px-1.5 text-xs"
                              >
                                <RiArrowUpLine className="size-3.5" />
                                ASC
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value="DESC"
                                aria-label="Sort descending"
                                className="gap-1 px-1.5 text-xs"
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
                              className="
                                opacity-0 transition-opacity
                                group-hover:opacity-100
                              "
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                    >
                      <RiAddLine className="size-4" />
                      Add column to sort
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="start" side="left">
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
                              <span className="truncate">{column.id}</span>
                              {column.type && (
                                <span className="
                                  ml-auto text-right text-xs
                                  text-muted-foreground
                                "
                                >
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
