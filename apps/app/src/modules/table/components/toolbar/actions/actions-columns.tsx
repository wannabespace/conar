import {
  DatabaseIcon,
  LayoutThreeColumnIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { pick } from '@tamery/shared/utils'
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
import { useSubscription } from 'seitu/react'

import { plural } from '~/lib/plural'

import { useTableColumnsContext } from '../../../lib/columns'
import { orderColumns, useTablePageStore } from '../../../lib/store'

export const ActionsColumns = () => {
  const store = useTablePageStore()
  const { columnOrder, hiddenColumns } = useSubscription(store, {
    selector: (state) => pick(state, ['columnOrder', 'hiddenColumns']),
  })
  const { columns: tableColumns, isPending } = useTableColumnsContext()
  const columns = orderColumns(tableColumns, columnOrder)
  const hiddenCount = hiddenColumns.filter((id) =>
    columns.some((column) => column.id === id)
  ).length
  let label = plural(columns.length, 'column')
  if (isPending) {
    label = 'Loading columns…'
  } else if (hiddenCount > 0) {
    label = `${columns.length} columns · ${hiddenCount} hidden`
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          aria-label={label}
          render={
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  // oxlint-disable-next-line shadcn/no-restyle -- toolbar counters share one compact shape
                  className="gap-1.5 px-2.5"
                />
              }
            />
          }
        >
          <HugeiconsIcon
            icon={LayoutThreeColumnIcon}
            strokeWidth={2}
            className="text-muted-foreground/60"
          />
          {isPending ? (
            <Skeleton className="h-2.5 w-3 rounded-full" />
          ) : (
            <NumberFlow
              value={columns.length - hiddenCount}
              suffix={hiddenCount > 0 ? `/${columns.length}` : undefined}
              className="text-2xs font-normal tabular-nums"
            />
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
      <PopoverContent
        // oxlint-disable-next-line shadcn/no-restyle -- full-bleed content owns its padding
        className="w-2xs gap-0 p-0"
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
                    (state) =>
                      ({
                        ...state,
                        hiddenColumns:
                          (hiddenColumns.length === 0 &&
                            columns?.map((col) => col.id)) ||
                          [],
                      }) satisfies typeof state
                  )
                }
              >
                <span className="size-4">
                  {hiddenColumns.length === 0 && (
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      strokeWidth={2}
                      className="size-4 opacity-50"
                    />
                  )}
                </span>
                <HugeiconsIcon
                  icon={LayoutThreeColumnIcon}
                  strokeWidth={2}
                  className="size-4 opacity-50"
                />
                <span>
                  {hiddenColumns.length === 0
                    ? 'Hide all columns'
                    : 'Show all columns'}
                </span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {columns?.map((column) => (
                <CommandItem
                  key={column.id}
                  value={column.id}
                  keywords={[
                    column.id,
                    column.type ?? '',
                    column.typeLabel ?? '',
                  ]}
                  onSelect={() =>
                    store.set(
                      (state) =>
                        ({
                          ...state,
                          hiddenColumns: hiddenColumns.includes(column.id)
                            ? hiddenColumns.filter((id) => id !== column.id)
                            : [...hiddenColumns, column.id],
                        }) satisfies typeof state
                    )
                  }
                >
                  <span className="size-4 shrink-0">
                    {!hiddenColumns.includes(column.id) && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        strokeWidth={2}
                        className="size-4 opacity-50"
                      />
                    )}
                  </span>
                  <HugeiconsIcon
                    icon={DatabaseIcon}
                    strokeWidth={2}
                    className="size-4 shrink-0 opacity-50"
                  />
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
