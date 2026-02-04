import type { ActiveFilter, Filter } from '@conar/shared/filters'
import { useEffect, useRef, useState } from 'react'
import { useInternalContext } from './context'
import { FiltersColumnSelector } from './filters-column-selector'
import { FiltersSelector } from './filters-selector'
import { FilterValueSelector } from './filters-value-selector'

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
        <FiltersColumnSelector onSelect={setSelectedColumn} />
      )}
      {column && !selectedFilter && (
        <FiltersSelector
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
