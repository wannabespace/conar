import type { ActiveFilter } from '@conar/shared/filters'
import type { Dispatch, SetStateAction } from 'react'
import type { Column } from './utils'
import { createContext, use } from 'react'

export const CellContext = createContext<{
  rowIndex: number
  newValue: string
  setNewValue: Dispatch<SetStateAction<string>>
  column: Column
  value: unknown
  onUpdate: (value: string | null) => void
  availableValues?: string[]
  onAddFilter?: (filter: ActiveFilter) => void
  onSort?: (columnId: string, order: 'ASC' | 'DESC' | null) => void
  sortOrder?: 'ASC' | 'DESC' | null
  onRenameColumn?: () => void
}>(null!)

export function useCellContext() {
  return use(CellContext)
}
