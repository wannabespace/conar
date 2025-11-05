import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@conar/ui/components/command'
import { Indicator } from '@conar/ui/components/custom/indicator'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiCheckLine, RiDatabase2Line, RiLayoutColumnLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useTableColumns } from '../-queries/use-columns-query'
import { usePageStoreContext } from '../-store'

export function HeaderActionsColumns({ database, table, schema }: { database: typeof databases.$inferSelect, table: string, schema: string }) {
  const store = usePageStoreContext()
  const hiddenColumns = useStore(store, state => state.hiddenColumns)
  const columns = useTableColumns({ database, table, schema })

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="overflow-visible"
              >
                <RiLayoutColumnLine />
                {hiddenColumns.length > 0 && <Indicator />}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            Columns visibility
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="p-0 w-2xs" side="bottom" align="end">
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList className="h-fit max-h-[70vh]">
            <CommandEmpty>No columns found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="toggle-columns"
                onSelect={() => store.setState(state => ({
                  ...state,
                  hiddenColumns: (hiddenColumns.length === 0 && columns?.map(col => col.id)) || [],
                } satisfies typeof state))}
              >
                <span className="size-4">
                  {hiddenColumns.length === 0 && <RiCheckLine className="size-4 opacity-50" />}
                </span>
                <RiLayoutColumnLine className="size-4 opacity-50" />
                <span>{hiddenColumns.length === 0 ? 'Hide all columns' : 'Show all columns'}</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {columns?.map(column => (
                <CommandItem
                  key={column.id}
                  value={column.id}
                  keywords={[column.id, column.type]}
                  onSelect={() => store.setState(state => ({
                    ...state,
                    hiddenColumns: hiddenColumns.includes(column.id)
                      ? hiddenColumns.filter(id => id !== column.id)
                      : [...hiddenColumns, column.id],
                  } satisfies typeof state))}
                >
                  <span className="size-4 shrink-0">
                    {!hiddenColumns.includes(column.id) && <RiCheckLine className="size-4 opacity-50" />}
                  </span>
                  <RiDatabase2Line className="size-4 opacity-50 shrink-0" />
                  <span data-mask className="truncate">{column.id}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
