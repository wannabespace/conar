import type { ActiveFilter } from '@conar/shared/filters'
import type { Column } from './utils'
import { useState } from 'react'
import { CellContext } from './cell-context'
import { getEditableValue } from './utils'

export function TableCellProvider({
  rowIndex,
  children,
  onAddFilter,
  onSort,
  sortOrder,
  onRenameColumn,
  column,
  value,
  availableValues,
  onUpdate,
}: {
  rowIndex: number
  children: React.ReactNode
  onAddFilter?: (filter: ActiveFilter) => void
  onSort?: (columnId: string, order: 'ASC' | 'DESC' | null) => void
  sortOrder?: 'ASC' | 'DESC' | null
  onRenameColumn?: () => void
  column: Column
  value: unknown
  availableValues?: string[]
  onUpdate: (value: string | null) => void
}) {
  const [newValue, setNewValue] = useState(() => getEditableValue({
    value,
    column,
  }))
  return (
    <CellContext value={{
      rowIndex,
      newValue,
      setNewValue,
      column,
      value,
      onUpdate,
      availableValues,
      onAddFilter,
      onSort,
      sortOrder,
      onRenameColumn,
    }}
    >
      {children}
    </CellContext>
  )
}
