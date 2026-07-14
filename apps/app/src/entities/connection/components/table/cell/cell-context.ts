import type { ActiveFilter } from '@tamery/shared/filters'
import type { Dispatch, SetStateAction } from 'react'
import { createContext, use } from 'react'

import type { ValueTransformer } from '~/entities/connection/transformers'

import type { Column } from './utils'

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
  onOrder?: (order: 'ASC' | 'DESC' | null) => void
  order?: 'ASC' | 'DESC' | null
  onRename?: () => void
}>(null!)

export function useCellContext() {
  return use(CellContext)
}
