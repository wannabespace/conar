import type { ActiveFilter, Filter } from '@conar/shared/filters'
import { Store } from '@tanstack/react-store'
import { type } from 'arktype'
import { createContext, use } from 'react'

export interface SelectionState {
  anchorIndex: number | null
  focusIndex: number | null
  lastExpandDirection: 'up' | 'down' | null
}

export const storeState = type({
  selected: 'Record<string, string>[]',
  filters: type({
    column: 'string',
    ref: type('object') as type.cast<Filter>,
    values: 'string[]',
  }).array() as type.cast<ActiveFilter[]>,
  exact: 'boolean',
  hiddenColumns: 'string[]',
  orderBy: {
    '[string]': '"ASC" | "DESC"',
  },
  prompt: 'string',
  columnSizes: 'Record<string, number>',
  lastClickedIndex: 'number | null',
  selectionState: type({
    anchorIndex: 'number | null',
    focusIndex: 'number | null',
    lastExpandDirection: '"up" | "down" | null',
  }) as type.cast<SelectionState>,
})

const defaultState: typeof storeState.infer = {
  selected: [],
  filters: [],
  exact: false,
  prompt: '',
  hiddenColumns: [],
  orderBy: {},
  columnSizes: {},
  lastClickedIndex: null,
  selectionState: { anchorIndex: null, focusIndex: null, lastExpandDirection: null },
}

function getPageStoreKey(id: string, schema: string, table: string) {
  return `${id}.${schema}-${table}.store`
}

const storesMap = new Map<string, Store<typeof storeState.infer>>()

export function tablePageStore({ id, schema, table }: { id: string, schema: string, table: string }) {
  const key = `${id}.${schema}.${table}`

  if (storesMap.has(key)) {
    return storesMap.get(key)!
  }

  const persistedState = JSON.parse(
    sessionStorage.getItem(getPageStoreKey(id, schema, table))
    || '{}',
  ) as typeof defaultState

  const state = storeState(Object.assign(
    {},
    defaultState,
    persistedState,
  ))

  if (import.meta.env.DEV && state instanceof type.errors) {
    console.error('Invalid page store state', state.summary)
  }

  const store = new Store<typeof storeState.infer>(
    state instanceof type.errors ? defaultState : state,
  )

  store.subscribe(({ currentVal }) => {
    sessionStorage.setItem(getPageStoreKey(id, schema, table), JSON.stringify({
      selected: currentVal.selected,
      filters: currentVal.filters,
      exact: currentVal.exact,
      hiddenColumns: currentVal.hiddenColumns,
      orderBy: currentVal.orderBy,
      prompt: currentVal.prompt,
      columnSizes: currentVal.columnSizes,
    } satisfies Omit<typeof currentVal, 'lastClickedIndex' | 'selectionState'>))
  })

  storesMap.set(key, store)

  return store
}

export const PageStoreContext = createContext<Store<typeof storeState.infer>>(null!)

export function usePageStoreContext() {
  return use(PageStoreContext)
}
