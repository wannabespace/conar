import type { ActiveFilter } from '@conar/shared/filters'
import { Button } from '@conar/ui/components/button'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Separator } from '@conar/ui/components/separator'
import { useToggle } from '@conar/ui/hookas/use-toggle'
import { RiAddLine, RiCloseLine, RiDatabase2Line, RiFilterOffLine } from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useState } from 'react'
import { usePageStoreContext } from '../../-store'
import { FiltersColumnSelector } from './filters-column-selector'
import { FilterForm } from './filters-form'
import { FiltersSelector } from './filters-selector'
import { FilterValueSelector } from './filters-value-selector'

function FilterItem({
  filter,
  onRemove,
  onEdit,
}: {
  filter: ActiveFilter
  onRemove: () => void
  onEdit: (filter: ActiveFilter) => void
}) {
  const [values, setValues] = useState(filter.values)

  return (
    <div className={`
      flex h-6 items-center overflow-hidden rounded-sm border bg-card
    `}
    >
      <Popover>
        <PopoverTrigger
          data-mask
          className={`
            flex h-full items-center gap-1 px-2 text-xs font-medium
            transition-colors
            hover:bg-accent/50
          `}
        >
          <RiDatabase2Line className="size-3 text-primary/70" />
          {filter.column}
        </PopoverTrigger>
        <PopoverContent className="p-0 shadow-md">
          <FiltersColumnSelector
            onSelect={column => onEdit({ column, ref: filter.ref, values })}
          />
        </PopoverContent>
      </Popover>
      <Separator orientation="vertical" />
      <Popover>
        <PopoverTrigger className={`
          h-full px-2 text-xs text-muted-foreground transition-colors
          hover:bg-accent/50
        `}
        >
          {filter.ref.operator}
        </PopoverTrigger>
        <PopoverContent className="p-0 shadow-md">
          <FiltersSelector
            onSelect={operator => onEdit({ column: filter.column, ref: operator, values })}
          />
        </PopoverContent>
      </Popover>
      <Separator orientation="vertical" />
      {filter.ref.hasValue !== false && (
        <>
          <Popover>
            <PopoverTrigger className={`
              h-full px-2 text-xs transition-colors
              hover:bg-accent/50
            `}
            >
              <div data-mask className="max-w-60 truncate font-mono">
                {filter.values?.join(', ')}
                {(filter.values?.length === 0 || filter.values?.every(value => value === '')) && (
                  <span className="opacity-30">
                    Empty
                  </span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="max-h-[calc(100vh-10rem)] p-0 shadow-md">
              <FilterValueSelector
                column={filter.column}
                operator={filter.ref.operator}
                isArray={filter.ref.isArray ?? false}
                values={values}
                onChange={setValues}
                onApply={() => onEdit({ column: filter.column, ref: filter.ref, values })}
              />
            </PopoverContent>
          </Popover>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}
      <button
        type="button"
        className={`
          flex h-full w-6 items-center justify-center transition-colors
          hover:bg-destructive/10 hover:text-destructive
        `}
        onClick={onRemove}
        aria-label="Remove filter"
      >
        <RiCloseLine className="size-3.5" />
      </button>
    </div>
  )
}

export function Filters() {
  const store = usePageStoreContext()
  const filters = useStore(store, state => state.filters)
  const [isOpened, toggleForm] = useToggle()

  if (filters.length === 0) {
    return null
  }

  return (
    <div className="flex justify-between gap-2">
      <div className="flex flex-wrap gap-2">
        {filters.map(filter => (
          <FilterItem
            key={`${filter.column}-${filter.ref.operator}-${filter.values.join(',')}`}
            filter={filter}
            onRemove={() => store.setState(state => ({
              ...state,
              filters: state.filters.filter(f => f !== filter),
            } satisfies typeof state))}
            onEdit={({ column, ref, values }) => store.setState(state => ({
              ...state,
              filters: state.filters.map(f => f === filter
                ? { column, ref, values }
                : f),
            } satisfies typeof state))}
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
                  filters: [...state.filters, filter],
                } satisfies typeof state))
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
        } satisfies typeof state))}
      >
        <RiFilterOffLine className="size-3 text-destructive" />
        Clear
      </Button>
    </div>
  )
}
