import type { ActiveFilter, Filter, FilterGroup } from '@conar/shared/filters'
import type { RefObject } from 'react'
import { FILTER_GROUPS_LABELS } from '@conar/shared/filters'
import { Button } from '@conar/ui/components/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@conar/ui/components/command'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Separator } from '@conar/ui/components/separator'
import { RiCloseLine, RiCornerDownLeftLine, RiDatabase2Line, RiFilterLine } from '@remixicon/react'
import { createContext, use, useEffect, useRef, useState } from 'react'

interface Column {
  id: string
  type: string
}

const FilterInternalContext = createContext<{
  columns: Column[]
  filtersGrouped: { group: FilterGroup, filters: Filter[] }[]
}>(null!)

function useInternalContext() {
  return use(FilterInternalContext)
}

function FilterColumnSelector({ ref, onSelect }: { ref?: RefObject<HTMLInputElement | null>, onSelect: (column: string) => void }) {
  const { columns } = useInternalContext()

  return (
    <Command>
      <CommandInput ref={ref} placeholder="Select column to filter..." />
      <CommandList className="h-fit max-h-[70vh]">
        <CommandEmpty>No columns found.</CommandEmpty>
        <CommandGroup>
          {columns.map(column => (
            <CommandItem
              key={column.id}
              value={column.id}
              keywords={[column.id, column.type]}
              onSelect={onSelect}
            >
              <RiDatabase2Line className="size-4 opacity-50" />
              <span>{column.id}</span>
              <span className="ml-auto text-xs text-muted-foreground text-right">{column.type}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

function FilterSelector({
  ref,
  onSelect,
  onBackspace,
}: {
  ref?: RefObject<HTMLInputElement | null>
  onSelect: (filter: Filter) => void
  onBackspace?: () => void
}) {
  const { filtersGrouped } = useInternalContext()

  return (
    <Command>
      <CommandInput
        ref={ref}
        placeholder="Select operator..."
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            onBackspace?.()
          }
        }}
      />
      <CommandList className="h-fit max-h-[70vh]">
        <CommandEmpty>No operators found.</CommandEmpty>
        {filtersGrouped.map(({ group, filters }) => (
          <CommandGroup key={group} heading={FILTER_GROUPS_LABELS[group]}>
            {filters.map((filter) => {
              return (
                <CommandItem
                  key={filter.operator}
                  value={filter.operator}
                  keywords={[filter.label, filter.operator]}
                  onSelect={() => onSelect(filter)}
                >
                  <RiFilterLine className="size-4 opacity-50" />
                  <span>{filter.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground text-right">{filter.operator}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}

function FilterValueSelector({
  ref,
  column,
  operator,
  values,
  onChange,
  onApply,
  onBackspace,
}: {
  ref?: RefObject<HTMLInputElement | null>
  column: string
  operator: string
  values: unknown[]
  onChange: (value: string[]) => void
  onApply: () => void
  onBackspace?: () => void
}) {
  return (
    <Command>
      <div>
        <CommandInput
          ref={ref}
          value={values[0] as string} // TODO: due to the current implementation where available only 1 value
          onValueChange={value => onChange([value])}
          placeholder={`Enter value for ${column}...`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onApply()
            }
            if (e.key === 'Backspace') {
              onBackspace?.()
            }
          }}
        />
        <div className="px-4 py-4 flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Filtering</span>
              <span className="font-medium text-primary">{column}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Operator</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">{operator}</span>
            </div>
          </div>
          {operator.toLowerCase().includes('like') && (
            <div className="px-3 py-2 bg-primary/5 border border-primary/20 rounded-md text-xs text-foreground">
              <span className="text-primary font-semibold">Tip:</span>
              {' '}
              <span>
                Use
                <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">%</kbd>
                {' '}
                as wildcard
              </span>
            </div>
          )}
          {operator.toLowerCase().includes('in') && (
            <div className="px-3 py-2 bg-primary/5 border border-primary/20 rounded-md text-xs text-foreground">
              <span className="text-primary font-semibold">Tip:</span>
              {' '}
              <span>
                Separate multiple values with commas
                {' '}
                <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">,</kbd>
              </span>
            </div>
          )}
          {operator.toLowerCase().includes('between') && (
            <div className="px-3 py-2 bg-primary/5 border border-primary/20 rounded-md text-xs text-foreground">
              <span className="text-primary font-semibold">Tip:</span>
              {' '}
              <span>
                Separate range values with
                {' '}
                <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">AND</kbd>
              </span>
            </div>
          )}
        </div>
        <div className="p-2 border-t flex justify-end">
          <Button
            onClick={onApply}
            size="xs"
          >
            Apply Filter
            <RiCornerDownLeftLine className="size-3" />
          </Button>
        </div>
      </div>
    </Command>
  )
}

export function FilterItem({
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
    <div className="flex items-center border rounded-sm overflow-hidden h-6 bg-card">
      <Popover>
        <PopoverTrigger data-mask className="text-xs flex items-center gap-1 px-2 h-full hover:bg-accent/50 transition-colors font-medium">
          <RiDatabase2Line className="size-3 text-primary/70" />
          {filter.column}
        </PopoverTrigger>
        <PopoverContent className="p-0 shadow-md">
          <FilterColumnSelector
            onSelect={column => onEdit({ column, ref: filter.ref, values })}
          />
        </PopoverContent>
      </Popover>
      <Separator orientation="vertical" />
      <Popover>
        <PopoverTrigger className="text-xs px-2 h-full hover:bg-accent/50 transition-colors text-muted-foreground">
          {filter.ref.operator}
        </PopoverTrigger>
        <PopoverContent className="p-0 shadow-md">
          <FilterSelector
            onSelect={operator => onEdit({ column: filter.column, ref: operator, values })}
          />
        </PopoverContent>
      </Popover>
      {filter.ref.hasValue && (
        <>
          <Separator orientation="vertical" />
          <Popover>
            <PopoverTrigger className="text-xs px-2 h-full hover:bg-accent/50 transition-colors">
              <div data-mask className="font-mono truncate max-w-60">
                {filter.values?.join(', ')}
                {(filter.values?.length === 0 || filter.values?.every(value => value === '')) && <span className="opacity-30">Empty</span>}
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 shadow-md max-h-[calc(100vh-10rem)]">
              <FilterValueSelector
                column={filter.column}
                operator={filter.ref.operator}
                values={values}
                onChange={setValues}
                onApply={() => onEdit({ column: filter.column, ref: filter.ref, values })}
              />
            </PopoverContent>
          </Popover>
        </>
      )}
      <Separator orientation="vertical" className="h-6" />
      <button
        type="button"
        className="flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors h-full w-6"
        onClick={onRemove}
        aria-label="Remove filter"
      >
        <RiCloseLine className="size-3.5" />
      </button>
    </div>
  )
}

export function FilterForm({ onAdd }: { onAdd: (filter: ActiveFilter) => void }) {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null)
  const [values, setValues] = useState<string[]>([''])
  const { columns } = useInternalContext()

  const operatorRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (operatorRef.current) {
      operatorRef.current.focus()
    }
  }, [operatorRef, selectedColumn, selectedFilter])

  const valueRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (valueRef.current) {
      valueRef.current.focus()
    }
  }, [valueRef, selectedFilter])

  const column = columns.find(column => column.id === selectedColumn)

  useEffect(() => {
    if (column && selectedFilter && !selectedFilter.hasValue) {
      onAdd({ column: column.id, ref: selectedFilter, values })
    }
  }, [column, selectedFilter, values, onAdd])

  return (
    <div>
      {!column && (
        <FilterColumnSelector onSelect={setSelectedColumn} />
      )}
      {column && !selectedFilter && (
        <FilterSelector
          ref={operatorRef}
          onSelect={setSelectedFilter}
          onBackspace={() => {
            if (values.length === 0) {
              setSelectedColumn(null)
            }
          }}
        />
      )}
      {column && selectedFilter && (
        <FilterValueSelector
          ref={valueRef}
          column={column.id}
          operator={selectedFilter.operator}
          values={values}
          onChange={setValues}
          onApply={() => onAdd({ column: column.id, ref: selectedFilter, values })}
          onBackspace={() => {
            if (values.length === 0) {
              setSelectedFilter(null)
            }
          }}
        />
      )}
    </div>
  )
}

export function FiltersProvider({
  children,
  columns,
  filtersGrouped,
}: {
  children: React.ReactNode
  columns: Column[]
  filtersGrouped: { group: FilterGroup, filters: Filter[] }[]
}) {
  return (
    <FilterInternalContext value={{ columns, filtersGrouped }}>
      {children}
    </FilterInternalContext>
  )
}
