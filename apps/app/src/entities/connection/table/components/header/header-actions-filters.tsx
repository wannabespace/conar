import { RiFilterLine } from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@tamery/ui/components/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { useTablePageStore } from '../../store'
import { FilterForm } from '../filters/filters-form'

export function HeaderActionsFilters() {
  const [isFiltersOpened, setIsFiltersOpened] = useState(false)
  const store = useTablePageStore()
  const activeCount = useSubscription(store, { selector: state => state.filters.length })

  return (
    <Popover open={isFiltersOpened} onOpenChange={setIsFiltersOpened}>
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
          <RiFilterLine />
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
            ? `${activeCount} active filter${activeCount === 1 ? '' : 's'} · add new`
            : 'Add new filter'}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="w-2xs p-0 **:data-[slot=popover-viewport]:p-0"
        side="bottom"
        align="end"
      >
        <FilterForm
          onAdd={filter => {
            setIsFiltersOpened(false)
            store.set(
              state =>
                ({
                  ...state,
                  filters: [...state.filters, filter],
                }) satisfies typeof state,
            )
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
