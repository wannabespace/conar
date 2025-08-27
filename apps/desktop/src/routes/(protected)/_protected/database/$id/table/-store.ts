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

export function getPageStoreState(id: string, schema: string, table: string) {
  const parsed = storeState(JSON.parse(sessionStorage.getItem(`${id}.${schema}.${table}-store`) ?? '{}'))

  if (parsed instanceof type.errors)
    return null

  return parsed
}

const storesMap = new Map<string, Store<typeof storeState.infer>>()

export function createPageStore({ id, schema, table }: { id: string, schema: string, table: string }) {
  const key = `${id}.${schema}.${table}`

  if (storesMap.has(key)) {
    return storesMap.get(key)!
  }

  const store = new Store<typeof storeState.infer>(getPageStoreState(id, schema, table)
    ?? {
      selected: [],
      filters: [],
      prompt: '',
      hiddenColumns: [],
      orderBy: {},
    })

  store.subscribe((state) => {
    sessionStorage.setItem(`${key}-store`, JSON.stringify(state.currentVal))
  })

  storesMap.set(key, store)

  return store
}

export const PageStoreContext = createContext<Store<typeof storeState.infer>>(null!)

export function usePageStoreContext() {
  return use(PageStoreContext)
}
