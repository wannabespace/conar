import type { WhereFilter } from '~/entities/database'
import { Button } from '@conar/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { RiFilterLine } from '@remixicon/react'
import { useState } from 'react'
import { FilterForm } from '~/components/table'
import { usePageContext } from '..'

export function HeaderActionsFilters() {
  const [isFiltersOpened, setIsFiltersOpened] = useState(false)
  const { store } = usePageContext()

  return (
    <Popover open={isFiltersOpened} onOpenChange={setIsFiltersOpened}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button size="icon" variant="outline">
                <RiFilterLine />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            Add new filter
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="p-0 w-2xs" side="bottom" align="end">
        <FilterForm
          onAdd={(filter) => {
            setIsFiltersOpened(false)
            store.setState(state => ({
              ...state,
              filters: [...state.filters, filter as WhereFilter],
            }))
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
