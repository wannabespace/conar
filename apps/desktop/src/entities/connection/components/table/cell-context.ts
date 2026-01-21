import type { UseMutateFunction } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import type { Column } from './utils'
import { createContext, use } from 'react'

export const CellContext = createContext<{
  value: string
  setValue: Dispatch<SetStateAction<string>>
  column: Column
  initialValue: unknown
  displayValue: string
  update: UseMutateFunction<void, Error, { value: string | null, rowIndex: number }>
  values?: string[]
}>(null!)

export function useCellContext() {
  return use(CellContext)
}
