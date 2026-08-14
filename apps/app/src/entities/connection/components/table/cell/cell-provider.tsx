import type { ActiveFilter } from '@tamery/shared/filters'
import { useState } from 'react'
import { toast } from 'sonner'

import type { ValueTransformer } from '~/entities/connection/transformers'

import { CellContext } from './cell-context'
import type { Column } from './utils'

export const TableCellProvider = ({
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
}) => {
  const [newValue, setNewValue] = useState(() =>
    transformer.fromConnection(value).toUI()
  )
  const [rawValue, setRawValue] = useState(() =>
    transformer.fromConnection(value).toRaw()
  )

  const queue = (queuedValue: unknown) => {
    if (!onQueueValue) {
      return
    }

    try {
      onQueueValue(rowIndex, queuedValue)
      setNewValue(transformer.fromConnection(queuedValue).toUI())
      setRawValue(transformer.fromConnection(queuedValue).toRaw())
    } catch (error) {
      const normalized =
        error instanceof Error ? error : new Error(String(error))
      console.error(normalized)

      toast.error(`Failed to queue value for "${column.id}"`, {
        description: normalized.message,
        duration: 3000,
        id: `queue-cell-error-${column.id}-${normalized.message}`,
      })
    }
  }

  return (
    <CellContext
      value={{
        column,
        newValue,
        onAddFilter,
        onOrder,
        onQueueValue: queue,
        onRename,
        order,
        rawValue,
        rowIndex,
        setNewValue,
        setRawValue,
        transformer,
        value,
      }}
    >
      {children}
    </CellContext>
  )
}
