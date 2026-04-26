import type { ActiveFilter } from '@conar/shared/filters'
import type { Dispatch, SetStateAction } from 'react'
import type { Column } from './utils'
import type { ValueTransformer } from '~/entities/connection/transformers'
import { createContext, use } from 'react'

export type SaveStatus = 'idle' | 'pending' | 'draft' | 'error'

export const CellContext = createContext<{
  rowIndex: number
  newValue: unknown
  setNewValue: Dispatch<SetStateAction<unknown>>
  rawValue: string
  setRawValue: Dispatch<SetStateAction<string>>
  column: Column
  value: unknown
  onQueueValue?: (rawValue: unknown) => void
  transformer: ValueTransformer
  onAddFilter?: (filter: ActiveFilter) => void
  onSort?: (columnId: string, order: 'ASC' | 'DESC' | null) => void
  sortOrder?: 'ASC' | 'DESC' | null
  onRenameColumn?: () => void
}>(null!)

export function useCellContext() {
  return use(CellContext)
}
