import { use } from 'react'
import { CellContext } from './cell-context'

export function useCellContext() {
  return use(CellContext)
}
