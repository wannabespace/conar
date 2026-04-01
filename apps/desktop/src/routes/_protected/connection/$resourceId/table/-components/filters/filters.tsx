import type { ActiveFilter } from '@conar/shared/filters'
import { Button } from '@conar/ui/components/button'
import { Group, GroupSeparator } from '@conar/ui/components/group'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { useToggle } from '@conar/ui/hookas/use-toggle'
import { RiAddLine, RiCloseLine, RiDatabase2Line, RiFilterOffLine } from '@remixicon/react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { useTablePageStore } from '../../-store'
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
  const [isColumnOpen, setIsColumnOpen] = useState(false)
  const [isOperatorOpen, setIsOperatorOpen] = useState(false)
  const [isValueOpen, setIsValueOpen] = useState(false)
  const [values, setValues] = useState(filter.values)

  return (
    <Group>
      <Popover open={isColumnOpen} onOpenChange={setIsColumnOpen}>
        <PopoverTrigger
          data-mask
          render={<Button size="xs" variant="outline" />}
        >
          <RiDatabase2Line className="size-3 text-muted-foreground" />
          {filter.column}
        </PopoverTrigger>
        <PopoverContent className="
          p-0
          **:data-[slot=popover-viewport]:p-0
        "
        >
          <FiltersColumnSelector
            onSelect={(column) => {
              onEdit({ column, ref: filter.ref, values })
              setIsColumnOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      <GroupSeparator />
      <Popover open={isOperatorOpen} onOpenChange={setIsOperatorOpen}>
        <PopoverTrigger
          render={<Button size="xs" variant="outline" />}
        >
          {filter.ref.operator}
        </PopoverTrigger>
        <PopoverContent className="
          p-0
          **:data-[slot=popover-viewport]:p-0
        "
        >
          <FiltersSelector
            onSelect={(operator) => {
              onEdit({ column: filter.column, ref: operator, values })
              setIsOperatorOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {filter.ref.hasValue !== false && (
        <>
          <GroupSeparator />
          <Popover open={isValueOpen} onOpenChange={setIsValueOpen}>
            <PopoverTrigger
              render={<Button size="xs" variant="outline" />}
              className="max-w-72"
            >
              <span className="truncate">
                {(filter.values?.length === 0 || filter.values?.every(value => value === ''))
                  ? <span className="opacity-30">Empty</span>
                  : filter.values?.join(', ')}
              </span>
            </PopoverTrigger>
            <PopoverContent className="
              max-h-[calc(100vh-10rem)] p-0
              **:data-[slot=popover-viewport]:p-0
            "
            >
              <FilterValueSelector
                column={filter.column}
                operator={filter.ref.operator}
                isArray={filter.ref.isArray ?? false}
                values={values}
                onChange={setValues}
                onApply={() => {
                  onEdit({ column: filter.column, ref: filter.ref, values })
                  setIsValueOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </>
      )}
      <GroupSeparator />
      <Button
        size="icon-xs"
        variant="destructive-outline"
        onClick={onRemove}
        aria-label="Remove filter"
      >
        <RiCloseLine className="size-3.5" />
      </Button>
    </Group>
  )
}

export function Filters() {
  const store = useTablePageStore()
  const filters = useSubscription(store, { selector: state => state.filters })
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
            onRemove={() => store.set(state => ({
              ...state,
              filters: state.filters.filter(f => f !== filter),
            } satisfies typeof state))}
            onEdit={({ column, ref, values }) => store.set(state => ({
              ...state,
              filters: state.filters.map(f => f === filter
                ? { column, ref, values }
                : f),
            } satisfies typeof state))}
          />
        ))}
        <Popover open={isOpened} onOpenChange={toggleForm}>
          <PopoverTrigger render={(
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => toggleForm()}
            />
          )}
          >
            <RiAddLine className="size-4" />
          </PopoverTrigger>
          <PopoverContent className="
            p-0
            **:data-[slot=popover-viewport]:p-0
          "
          >
            <FilterForm
              onAdd={(filter) => {
                toggleForm(false)
                store.set(state => ({
                  ...state,
                  filters: [...state.filters, filter],
                } satisfies typeof state))
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Button
        variant="destructive-outline"
        size="xs"
        onClick={() => store.set(state => ({
          ...state,
          filters: [],
        } satisfies typeof state))}
      >
        <RiFilterOffLine className="size-3" />
        Clear
      </Button>
    </div>
  )
}
