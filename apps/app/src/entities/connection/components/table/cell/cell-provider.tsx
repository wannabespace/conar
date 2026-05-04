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
  onOrder,
  order,
  onRename,
  column,
  value,
  onQueueValue,
  transformer,
}: {
  rowIndex: number
  column: Column
  value: unknown
  onAddFilter?: (filter: ActiveFilter) => void
  onOrder?: (order: 'ASC' | 'DESC' | null) => void
  order?: 'ASC' | 'DESC' | null
  onRename?: () => void
  onQueueValue?: (rowIndex: number, value: unknown) => unknown
  transformer: ValueTransformer
  children: React.ReactNode
}) {
  const [newValue, setNewValue] = useState(() => transformer.fromConnection(value).toUI())
  const [rawValue, setRawValue] = useState(() => transformer.fromConnection(value).toRaw())

  const queue = async (rawValue: unknown) => {
    if (!onQueueValue)
      return

    try {
      onQueueValue(rowIndex, rawValue)
      setNewValue(transformer.fromConnection(rawValue).toUI())
      setRawValue(transformer.fromConnection(rawValue).toRaw())
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
      onOrder,
      order,
      onRename,
    }}
    >
      {children}
    </CellContext>
  )
}
