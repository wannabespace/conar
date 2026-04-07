import type { ActiveFilter } from '@conar/shared/filters'
import type { Dispatch, SetStateAction } from 'react'
import type { Column } from './utils'
import type { ValueTransformer } from '~/entities/connection/transformers'
import { createContext, use } from 'react'

export type SaveStatus = 'idle' | 'pending' | 'success' | 'error'

export const CellContext = createContext<{
  rowIndex: number
  newValue: string
  setNewValue: Dispatch<SetStateAction<string>>
  column: Column
  value: unknown
  status: SaveStatus
  setStatus: Dispatch<SetStateAction<SaveStatus>>
  onSaveValue?: (value: string | string[] | null) => void
  transformer: ValueTransformer
  availableValues?: string[]
  onAddFilter?: (filter: ActiveFilter) => void
  onSort?: (columnId: string, order: 'ASC' | 'DESC' | null) => void
  sortOrder?: 'ASC' | 'DESC' | null
  onRenameColumn?: () => void
}>(null!)

export function useCellContext() {
  return use(CellContext)
}
