import type { ActiveFilter } from '@conar/shared/filters'
import type { Dispatch, SetStateAction } from 'react'
import type { SaveStatus } from './cell-context'
import type { Column } from './utils'
import type { ValueTransformer } from '~/entities/connection/transformers'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { CellContext } from './cell-context'

export function TableCellProvider({
  rowIndex,
  children,
  onAddFilter,
  onSort,
  sortOrder,
  onRenameColumn,
  status,
  column,
  value,
  setStatus,
  onSaveValue,
  transformer,
}: {
  rowIndex: number
  column: Column
  value: unknown
  status: SaveStatus
  setStatus: Dispatch<SetStateAction<SaveStatus>>
  onAddFilter?: (filter: ActiveFilter) => void
  onSort?: (columnId: string, order: 'ASC' | 'DESC' | null) => void
  sortOrder?: 'ASC' | 'DESC' | null
  onRenameColumn?: () => void
  onSaveValue?: (rowIndex: number, columnName: string, value: unknown) => Promise<unknown>
  transformer: ValueTransformer
  children: React.ReactNode
}) {
  const [newValue, setNewValue] = useState(() => transformer.fromConnection(value).toUI())
  const [rawValue, setRawValue] = useState(() => transformer.fromConnection(value).toRaw())
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const update = async (rawValue: unknown) => {
    if (!onSaveValue)
      return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setStatus('pending')

    try {
      const result = await onSaveValue(
        rowIndex,
        column.id,
        rawValue,
      )
      const newRawValue = result === undefined ? rawValue : result
      setNewValue(transformer.fromConnection(newRawValue).toUI())
      setRawValue(transformer.fromConnection(newRawValue).toRaw())
      setStatus('success')
      timeoutRef.current = setTimeout(setStatus, 3000, 'idle')
    }
    catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      console.error(error)

      toast.error(`Failed to update cell "${column.id}"`, {
        id: `save-cell-error-${column.id}-${error.message}`,
        description: error.message,
        duration: 3000,
      })
      setStatus('error')
      timeoutRef.current = setTimeout(setStatus, 3000, 'idle')
    }
  }

  return (
    <CellContext value={{
      rowIndex,
      newValue,
      setNewValue,
      column,
      value,
      status,
      setStatus,
      onSaveValue: update,
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
