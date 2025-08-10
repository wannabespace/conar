import type { WhereFilter } from '@conar/shared/sql/where'
import type { Store } from '@tanstack/react-store'
import { type } from 'arktype'
import { createContext, use } from 'react'

const storeState = type({
  selected: 'Record<string, string>[]',
  filters: type({
    column: 'string',
    operator: 'string' as type.cast<WhereFilter['operator']>,
    values: 'string[]',
  }).array(),
  hiddenColumns: 'string[]',
  orderBy: {
    '[string]': '"ASC" | "DESC"',
  },
  prompt: 'string',
})

export function getTableStoreState(schema: string, table: string) {
  const parsed = storeState(JSON.parse(sessionStorage.getItem(`${schema}.${table}-store`) ?? '{}'))

  if (parsed instanceof type.errors)
    return null

  return parsed
}

export interface PageStore {
  selected: Record<string, string>[]
  filters: WhereFilter[]
  hiddenColumns: string[]
  orderBy: Record<string, 'ASC' | 'DESC'>
  prompt: string
}

export const PageStoreContext = createContext<Store<PageStore>>(null!)

export function usePageStoreContext() {
  return use(PageStoreContext)
}
