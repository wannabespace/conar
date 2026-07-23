import { RiCheckLine, RiDatabase2Line, RiLayoutColumnLine } from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@tamery/ui/components/command'
import { Popover, PopoverContent, PopoverTrigger } from '@tamery/ui/components/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { useSubscription } from 'seitu/react'

import { useTableColumnsContext } from '../../-lib/columns'
import { useTablePageStore } from '../../-lib/store'

export function ActionsColumns() {
  const store = useTablePageStore()
  const hiddenColumns = useSubscription(store, { selector: state => state.hiddenColumns })
  const { columns } = useTableColumnsContext()

  return (
    <Popover>
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
          <RiLayoutColumnLine />
          {hiddenColumns.length > 0 && (
            <span
              className={`
                absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center
                justify-center rounded-full bg-primary px-1 text-2xs
                font-medium text-primary-foreground tabular-nums
              `}
            >
              {hiddenColumns.length}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent side="top">
          {hiddenColumns.length > 0
            ? `${hiddenColumns.length} hidden column${hiddenColumns.length === 1 ? '' : 's'}`
            : 'Columns visibility'}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="
          w-2xs p-0
          **:data-[slot=popover-viewport]:p-0
        "
        side="bottom"
        align="end"
      >
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList className="h-fit max-h-[70vh]">
            <CommandEmpty>No columns found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="toggle-columns"
                onSelect={() =>
                  store.set(
                    state =>
                      ({
                        ...state,
                        hiddenColumns:
                          (hiddenColumns.length === 0 && columns?.map(col => col.id)) || [],
                      }) satisfies typeof state,
                  )
                }
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
                  keywords={[column.id, column.type ?? '', column.typeLabel ?? '']}
                  onSelect={() =>
                    store.set(
                      state =>
                        ({
                          ...state,
                          hiddenColumns: hiddenColumns.includes(column.id)
                            ? hiddenColumns.filter(id => id !== column.id)
                            : [...hiddenColumns, column.id],
                        }) satisfies typeof state,
                    )
                  }
                >
                  <span className="size-4 shrink-0">
                    {!hiddenColumns.includes(column.id) && (
                      <RiCheckLine className="size-4 opacity-50" />
                    )}
                  </span>
                  <RiDatabase2Line className="size-4 shrink-0 opacity-50" />
                  <span data-mask className="truncate">
                    {column.id}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
