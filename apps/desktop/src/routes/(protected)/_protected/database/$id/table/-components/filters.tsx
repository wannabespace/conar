import type { WhereFilter } from '@conar/shared/sql/where'
import { Button } from '@conar/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { useToggle } from '@conar/ui/hookas/use-toggle'
import { RiAddLine, RiFilterOffLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { FilterForm, FilterItem } from '~/components/table'
import { usePageStoreContext } from '../-store'

export function Filters() {
  const store = usePageStoreContext()
  const filters = useStore(store, state => state.filters)
  const [isOpened, toggleForm] = useToggle()

  if (filters.length === 0) {
    return null
  }

  return (
    <div className="flex gap-2 justify-between">
      <div className="flex gap-2 flex-wrap">
        {filters.map(filter => (
          <FilterItem
            key={`${filter.column}-${filter.operator}-${filter.values?.join(',')}`}
            filter={filter}
            onRemove={() => store.setState(state => ({
              ...state,
              filters: state.filters.filter(f => f !== filter),
            }))}
            onEdit={({ column, operator, values }) => store.setState(state => ({
              ...state,
              filters: state.filters.map(f => f === filter
                ? { ...f, column, operator, values }
                : f),
            }))}
          />
        ))}
        <Popover open={isOpened} onOpenChange={toggleForm}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => toggleForm()}
            >
              <RiAddLine className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <FilterForm
              onAdd={(filter) => {
                toggleForm(false)
                store.setState(state => ({
                  ...state,
                  filters: [...state.filters, filter as WhereFilter],
                }))
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Button
        variant="outline"
        size="xs"
        onClick={() => store.setState(state => ({
          ...state,
          filters: [],
        }))}
      >
        <RiFilterOffLine className="size-3 text-destructive" />
        Clear
      </Button>
    </div>
  )
}
