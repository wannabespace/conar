import type { ActiveFilter } from '@conar/shared/filters'
import type { UseMutateFunction } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import type { Column } from './utils'
import { createContext, use } from 'react'

export const CellContext = createContext<{
  rowIndex: number
  newValue: string
  setNewValue: Dispatch<SetStateAction<string>>
  column: Column
  value: unknown
  displayValue: string
  update: UseMutateFunction<void, Error, { value: string | null, rowIndex: number }>
  values?: string[]
  onAddFilter?: (filter: ActiveFilter) => void
  onSort?: (columnId: string, order: 'ASC' | 'DESC' | null) => void
  sortOrder?: 'ASC' | 'DESC' | null
  onRenameColumn?: () => void
}>(null!)

export function useCellContext() {
  return use(CellContext)
}
