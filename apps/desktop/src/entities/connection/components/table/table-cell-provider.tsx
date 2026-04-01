import type { ActiveFilter } from '@conar/shared/filters'
import type { Column } from './utils'
import { useMutation } from '@tanstack/react-query'
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
  displayValue,
  onSaveValue,
  onSavePending,
  onSaveSuccess,
  onSaveError,
}: {
  rowIndex: number
  children: React.ReactNode
  onAddFilter?: (filter: ActiveFilter) => void
  onSort?: (columnId: string, order: 'ASC' | 'DESC' | null) => void
  sortOrder?: 'ASC' | 'DESC' | null
  onRenameColumn?: () => void
  column: Column
  value: unknown
  displayValue: string
  onSaveValue?: (rowIndex: number, columnsId: string, value: unknown) => Promise<void>
  onSavePending: () => void
  onSaveSuccess: () => void
  onSaveError?: (error: Error) => void
  availableValues?: string[]
}) {
  const [newValue, setNewValue] = useState<string>(() => getEditableValue({
    value,
    oneLine: false,
    column,
  }))

  const { mutate: update } = useMutation({
    mutationFn: async ({ rowIndex, value }: { value: string | null, rowIndex: number }) => {
      if (!onSaveValue)
        return

      onSavePending()

      await onSaveValue(
        rowIndex,
        column.id,
        value,
      )
    },
    onError: onSaveError,
    onSuccess: onSaveSuccess,
  })

  return (
    <CellContext value={{
      rowIndex,
      newValue,
      setNewValue,
      column,
      value,
      displayValue,
      update,
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
