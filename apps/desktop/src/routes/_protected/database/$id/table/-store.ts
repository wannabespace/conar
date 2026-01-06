import type { ActiveFilter, Filter } from '@conar/shared/filters'
import { Store } from '@tanstack/react-store'
import { type } from 'arktype'
import { createContext, use } from 'react'

export const storeState = type({
  selected: 'Record<string, string>[]',
  filters: type({
    column: 'string',
    ref: type('object') as type.cast<Filter>,
    values: 'string[]',
  }).array() as type.cast<ActiveFilter[]>,
  hiddenColumns: 'string[]',
  orderBy: {
    '[string]': '"ASC" | "DESC"',
  },
  prompt: 'string',
})

function getPageStoreKey(id: string, schema: string, table: string) {
  return `${id}.${schema}-${table}.store`
}

export function getPageStoreState(id: string, schema: string, table: string) {
  const parsed = storeState(JSON.parse(sessionStorage.getItem(getPageStoreKey(id, schema, table)) ?? 'null'))

  if (parsed instanceof type.errors) {
    return null
  }

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
    sessionStorage.setItem(getPageStoreKey(id, schema, table), JSON.stringify(state.currentVal))
  })

  storesMap.set(key, store)

  return store
}

export const PageStoreContext = createContext<Store<typeof storeState.infer>>(null!)

export function usePageStoreContext() {
  return use(PageStoreContext)
}
