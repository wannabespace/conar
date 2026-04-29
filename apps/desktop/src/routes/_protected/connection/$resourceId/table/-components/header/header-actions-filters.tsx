import { Button } from '@conar/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiFilterLine } from '@remixicon/react'
import { useState } from 'react'
import { useTablePageStore } from '../../-store'
import { FilterForm } from '../filters/filters-form'

export function HeaderActionsFilters() {
  const [isFiltersOpened, setIsFiltersOpened] = useState(false)
  const store = useTablePageStore()

  return (
    <Popover open={isFiltersOpened} onOpenChange={setIsFiltersOpened}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger render={<Button size="icon" variant="outline" />}>
            <RiFilterLine />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          Add new filter
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
        <FilterForm
          onAdd={(filter) => {
            setIsFiltersOpened(false)
            store.set(state => ({
              ...state,
              filters: [...state.filters, filter],
            } satisfies typeof state))
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
