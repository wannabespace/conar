import type { RefObject } from 'react'
import { Button } from '@conar/ui/components/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@conar/ui/components/command'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Separator } from '@conar/ui/components/separator'
import { RiCloseLine, RiCornerDownLeftLine, RiDatabase2Line, RiFilterLine } from '@remixicon/react'
import { createContext, use, useEffect, useMemo, useRef, useState } from 'react'

interface Column {
  name: string
  type: string
}

interface Filter {
  column: string
  operator: string
  values?: string[]
}

interface Operator {
  value: string
  label: string
  placeholder?: string
  hasValue: boolean
}

const FilterInternalContext = createContext<{
  columns: Column[]
  operators: Operator[]
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
              key={column.name}
              value={column.name}
              keywords={[column.name, column.type]}
              onSelect={onSelect}
            >
              <RiDatabase2Line className="size-4 opacity-50" />
              <span>{column.name}</span>
              <span className="ml-auto text-xs text-muted-foreground text-right">{column.type}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

function FilterOperatorSelector({
  ref,
  onSelect,
  onBackspace,
}: {
  ref?: RefObject<HTMLInputElement | null>
  onSelect: (operator: string) => void
  onBackspace?: () => void
}) {
  const { operators } = useInternalContext()

  const groupLabels = {
    comparison: 'Comparison',
    text: 'Text Search',
    list: 'List Operations',
    null: 'Null Checks',
    other: 'Other',
  } as const

  const groupedOperators = useMemo(() => {
    const groups: Omit<Record<keyof typeof groupLabels, Operator['value'][]>, 'other'> = {
      comparison: ['=', '!=', '>', '<', '>=', '<='],
      text: ['LIKE', 'ILIKE', 'NOT LIKE'],
      list: ['IN', 'NOT IN'],
      null: ['IS NULL', 'IS NOT NULL'],
    }

    return operators.reduce((acc, operator) => {
      let category: keyof typeof groupLabels = 'other'

      for (const [group, values] of Object.entries(groups)) {
        if (values.includes(operator.value)) {
          category = group as keyof typeof groupLabels
          break
        }
      }

      if (!acc[category])
        acc[category] = []

      acc[category].push(operator)

      return acc
    }, {} as Record<keyof typeof groupLabels, Operator[]>)
  }, [operators])

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
        {Object.entries(groupedOperators).map(([group, ops]) => (
          <CommandGroup key={group} heading={groupLabels[group as keyof typeof groupLabels] || group}>
            {ops.map(operator => (
              <CommandItem
                key={operator.value}
                value={operator.value}
                keywords={[operator.label, operator.value]}
                onSelect={onSelect}
              >
                <RiFilterLine className="size-4 opacity-50" />
                <span>{operator.label}</span>
                <span className="ml-auto text-xs text-muted-foreground text-right">{operator.value}</span>
              </CommandItem>
            ))}
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
  values: string[]
  onChange: (value: string[]) => void
  onApply: () => void
  onBackspace?: () => void
}) {
  return (
    <Command>
      <div>
        <CommandInput
          ref={ref}
          value={values[0]} // Temp due to the current implementation where available only 1 value
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
  filter: Filter
  onRemove: () => void
  onEdit: (params: { column: string, operator: string, values: string[] }) => void
}) {
  const [values, setValues] = useState(filter.values ?? [])
  const { operators } = useInternalContext()
  const showValue = useMemo(() => {
    const operator = operators.find(operator => operator.value === filter.operator)
    return !!operator?.hasValue
  }, [filter.operator])

  return (
    <div className="flex items-center border rounded-sm overflow-hidden h-6 bg-card">
      <Popover>
        <PopoverTrigger className="text-xs flex items-center gap-1 px-2 h-full hover:bg-accent/50 transition-colors font-medium">
          <RiDatabase2Line className="size-3 text-primary/70" />
          {filter.column}
        </PopoverTrigger>
        <PopoverContent className="p-0 shadow-md">
          <FilterColumnSelector
            onSelect={column => onEdit({ column, operator: filter.operator, values })}
          />
        </PopoverContent>
      </Popover>
      <Separator orientation="vertical" />
      <Popover>
        <PopoverTrigger className="text-xs px-2 h-full hover:bg-accent/50 transition-colors text-muted-foreground">
          {filter.operator}
        </PopoverTrigger>
        <PopoverContent className="p-0 shadow-md">
          <FilterOperatorSelector
            onSelect={operator => onEdit({ column: filter.column, operator, values })}
          />
        </PopoverContent>
      </Popover>
      {showValue && (
        <>
          <Separator orientation="vertical" />
          <Popover>
            <PopoverTrigger className="text-xs px-2 h-full hover:bg-accent/50 transition-colors">
              <div className="font-mono truncate max-w-60">
                {filter.values?.join(', ')}
                {(filter.values?.length === 0 || filter.values?.every(value => value === '')) && <span className="opacity-30">Empty</span>}
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 shadow-md max-h-[calc(100vh-10rem)]">
              <FilterValueSelector
                column={filter.column}
                operator={filter.operator}
                values={values} // Temp due to the current implementation where available only 1 value
                onChange={setValues}
                onApply={() => onEdit({ column: filter.column, operator: filter.operator, values })}
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

export function FilterForm({ onAdd }: { onAdd: (filter: Filter) => void }) {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null)
  const [values, setValues] = useState<string[]>([])
  const { columns, operators } = useInternalContext()

  const operatorRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (operatorRef.current) {
      operatorRef.current.focus()
    }
  }, [operatorRef, selectedColumn, selectedOperator])

  const valueRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (valueRef.current) {
      valueRef.current.focus()
    }
  }, [valueRef, selectedOperator])

  const column = useMemo(() => columns.find(column => column.name === selectedColumn), [columns, selectedColumn])
  const operator = useMemo(() => operators.find(operator => operator.value === selectedOperator), [operators, selectedOperator])

  useEffect(() => {
    if (column && operator && !operator.hasValue) {
      onAdd({ column: column.name, operator: operator.value })
    }
  }, [column, operator])

  return (
    <div>
      {!column && (
        <FilterColumnSelector onSelect={setSelectedColumn} />
      )}
      {column && !operator && (
        <FilterOperatorSelector
          ref={operatorRef}
          onSelect={setSelectedOperator}
          onBackspace={() => {
            if (values.length === 0) {
              setSelectedColumn(null)
            }
          }}
        />
      )}
      {column && selectedOperator && (
        <FilterValueSelector
          ref={valueRef}
          column={column.name}
          operator={selectedOperator}
          values={values}
          onChange={setValues}
          onApply={() => onAdd({ column: column.name, operator: selectedOperator, values })}
          onBackspace={() => {
            if (values.length === 0) {
              setSelectedOperator(null)
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
  operators,
}: {
  children: React.ReactNode
  columns: Column[]
  operators: Operator[]
}) {
  const context = useMemo(() => ({ columns, operators }), [columns, operators])

  return (
    <FilterInternalContext value={context}>
      {children}
    </FilterInternalContext>
  )
}
