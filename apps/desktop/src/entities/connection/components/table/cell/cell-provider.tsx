import type { ActiveFilter } from '@conar/shared/filters'
import type { Column } from './utils'
import type { ValueTransformer } from '~/entities/connection/transformers'
import { useState } from 'react'
import { CellContext } from './cell-context'

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
  transformer,
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
  onUpdate: (value: string | null, raw?: boolean) => void
  transformer: ValueTransformer
}) {
  const [newValue, setNewValue] = useState(() => transformer.toEditable(value))
  return (
    <CellContext value={{
      rowIndex,
      newValue,
      setNewValue,
      column,
      value,
      onUpdate,
      transformer,
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
