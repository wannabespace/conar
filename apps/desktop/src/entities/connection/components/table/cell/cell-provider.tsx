import type { ActiveFilter } from '@conar/shared/filters'
import type { Column } from './utils'
import type { ValueTransformer } from '~/entities/connection/transformers'
import { useState } from 'react'
import { toast } from 'sonner'
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
  onQueueValue,
  transformer,
}: {
  rowIndex: number
  column: Column
  value: unknown
  onAddFilter?: (filter: ActiveFilter) => void
  onSort?: (columnId: string, order: 'ASC' | 'DESC' | null) => void
  sortOrder?: 'ASC' | 'DESC' | null
  onRenameColumn?: () => void
  onQueueValue?: (rowIndex: number, columnName: string, value: unknown) => Promise<unknown>
  transformer: ValueTransformer
  children: React.ReactNode
}) {
  const [newValue, setNewValue] = useState(() => transformer.fromConnection(value).toUI())
  const [rawValue, setRawValue] = useState(() => transformer.fromConnection(value).toRaw())

  const queue = async (rawValue: unknown) => {
    if (!onQueueValue)
      return

    try {
      const result = await onQueueValue(rowIndex, column.id, rawValue)
      const newRawValue = result === undefined ? rawValue : result
      setNewValue(transformer.fromConnection(newRawValue).toUI())
      setRawValue(transformer.fromConnection(newRawValue).toRaw())
    }
    catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      console.error(error)

      toast.error(`Failed to queue value for "${column.id}"`, {
        id: `queue-cell-error-${column.id}-${error.message}`,
        description: error.message,
        duration: 3000,
      })
    }
  }

  return (
    <CellContext value={{
      rowIndex,
      newValue,
      setNewValue,
      column,
      value,
      onQueueValue: queue,
      rawValue,
      setRawValue,
      transformer,
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
