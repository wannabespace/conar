import type { ActiveFilter, Filter } from '@tamery/shared/filters'
import { useState } from 'react'

import { useTableColumnsContext } from '../../../-lib/columns'
import { FiltersColumnSelector } from './filters-column-selector'
import { FiltersOperatorSelector } from './filters-operator-selector'
import { FiltersValueSelector } from './filters-value-selector'

export const FilterForm = ({
  onAdd,
}: {
  onAdd: (filter: ActiveFilter) => void
}) => {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null)
  const [values, setValues] = useState<string[]>([''])
  const { columns } = useTableColumnsContext()

  const column = columns.find((col) => col.id === selectedColumn)

  const handleFilterSelect = (filter: Filter) => {
    if (filter.hasValue === false) {
      if (!column) {
        return
      }
      onAdd({ column: column.id, ref: filter, values: [''] })
    } else {
      setSelectedFilter(filter)
    }
  }

  return (
    <div>
      {!column && <FiltersColumnSelector onSelect={setSelectedColumn} />}
      {column && !selectedFilter && (
        <FiltersOperatorSelector
          ref={(element) => element?.focus()}
          onSelect={handleFilterSelect}
          onBackspace={() => {
            if (values.length === 0) {
              setSelectedColumn(null)
            }
          }}
        />
      )}
      {column && selectedFilter && (
        <FiltersValueSelector
          ref={(element) => element?.focus()}
          column={column.id}
          operator={selectedFilter.operator}
          isArray={selectedFilter.isArray ?? false}
          values={values}
          onChange={setValues}
          onApply={() =>
            onAdd({ column: column.id, ref: selectedFilter, values })
          }
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
