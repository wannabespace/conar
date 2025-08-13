import type { WhereFilter } from '@conar/shared/sql/where'
import { Store } from '@tanstack/react-store'
import { type } from 'arktype'
import { createContext, use } from 'react'

export const storeState = type({
  selected: 'Record<string, string>[]',
  filters: type({
    column: 'string',
    operator: 'string',
    values: 'string[]',
  }).array() as type.cast<WhereFilter[]>,
  hiddenColumns: 'string[]',
  orderBy: {
    '[string]': '"ASC" | "DESC"',
  },
  prompt: 'string',
})

export function getPageStoreState(schema: string, table: string) {
  const parsed = storeState(JSON.parse(sessionStorage.getItem(`${schema}.${table}-store`) ?? '{}'))

  if (parsed instanceof type.errors)
    return null

  return parsed
}

export function createPageStore({ schema, table }: { schema: string, table: string }) {
  const store = new Store<typeof storeState.infer>(getPageStoreState(schema, table)
    ?? {
      selected: [],
      filters: [],
      prompt: '',
      hiddenColumns: [],
      orderBy: {},
    })

  store.subscribe((state) => {
    sessionStorage.setItem(`${schema}.${table}-store`, JSON.stringify(state.currentVal))
  })

  return store
}

export const PageStoreContext = createContext<Store<typeof storeState.infer>>(null!)

export function usePageStoreContext() {
  return use(PageStoreContext)
}
