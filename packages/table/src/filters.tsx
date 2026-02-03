import type { ActiveFilter, Filter, FilterGroup } from '@conar/shared/filters'
import type { RefObject } from 'react'
import { FILTER_GROUPS } from '@conar/shared/filters'
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
              <span className="ml-auto text-right text-xs text-muted-foreground">{column.type}</span>
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
          <CommandGroup key={group} heading={FILTER_GROUPS[group]}>
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
                  <span className={`
                    ml-auto text-right text-xs text-muted-foreground
                  `}
                  >
                    {filter.operator}
                  </span>
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
  isArray,
  onChange,
  onApply,
  onBackspace,
}: {
  ref?: RefObject<HTMLInputElement | null>
  column: string
  operator: string
  isArray: boolean
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
          value={isArray ? values.join(',') : values[0] as string}
          onValueChange={value => onChange(isArray ? value.split(',') : [value])}
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
        <div className="flex flex-col gap-4 p-4 text-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Filtering</span>
              <span className="font-medium text-primary">{column}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Operator</span>
              <span className={`
                rounded-md bg-muted px-2 py-0.5 text-xs font-medium
                text-muted-foreground
              `}
              >
                {operator}
              </span>
            </div>
          </div>
          {operator.toLowerCase().includes('like') && (
            <div className={`
              rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs
              text-foreground
            `}
            >
              <span className="font-semibold text-primary">Tip:</span>
              {' '}
              <span>
                Use
                <kbd className="rounded-sm border bg-muted px-1.5 py-0.5 text-xs">%</kbd>
                {' '}
                as wildcard
              </span>
            </div>
          )}
          {operator.toLowerCase().includes('in') && (
            <div className={`
              rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs
              text-foreground
            `}
            >
              <span className="font-semibold text-primary">Tip:</span>
              {' '}
              <span>
                Separate multiple values with commas
                {' '}
                <kbd className="rounded-sm border bg-muted px-1.5 py-0.5 text-xs">,</kbd>
              </span>
            </div>
          )}
          {operator.toLowerCase().includes('between') && (
            <div className={`
              rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs
              text-foreground
            `}
            >
              <span className="font-semibold text-primary">Tip:</span>
              {' '}
              <span>
                Separate range values with
                {' '}
                <kbd className="rounded-sm border bg-muted px-1.5 py-0.5 text-xs">AND</kbd>
              </span>
            </div>
          )}
        </div>
        <div className="flex justify-end border-t p-2">
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
          <FilterColumnSelector
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
          <FilterSelector
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

  const handleFilterSelect = (filter: Filter) => {
    if (filter.hasValue === false) {
      onAdd({ column: column!.id, ref: filter, values: [''] })
    }
    else {
      setSelectedFilter(filter)
    }
  }

  return (
    <div>
      {!column && (
        <FilterColumnSelector onSelect={setSelectedColumn} />
      )}
      {column && !selectedFilter && (
        <FilterSelector
          ref={operatorRef}
          onSelect={handleFilterSelect}
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
          isArray={selectedFilter.isArray ?? false}
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
