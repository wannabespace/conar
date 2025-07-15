import type { WhereFilter } from '~/entities/database'
import { Button } from '@conar/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { useToggle } from '@conar/ui/hookas/use-toggle'
import { RiAddLine, RiFilterOffLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { FilterForm, FilterItem } from '~/components/table'
import { usePageContext } from '..'

export function Filters() {
  const { store } = usePageContext()
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
            key={`${filter.column}-${filter.operator}-${filter.value}`}
            filter={filter}
            onRemove={() => store.setState(state => ({
              ...state,
              filters: state.filters.filter(f => f !== filter),
            }))}
            onEdit={({ column, operator, value }) => store.setState(state => ({
              ...state,
              filters: state.filters.map(f => f === filter
                ? { ...f, column, operator: operator as WhereFilter['operator'], value }
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
        variant="ghost"
        size="xs"
        className="text-destructive!"
        onClick={() => store.setState(state => ({
          ...state,
          filters: [],
        }))}
      >
        <RiFilterOffLine className="size-3" />
        Clear
      </Button>
    </div>
  )
}
