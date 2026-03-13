import type { ActiveFilter, Filter } from '@conar/shared/filters'
import type { Store } from '@tanstack/react-store'
import { memoize } from '@conar/shared/utils/helpers'
import { createStore } from '@tanstack/react-store'
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
    ref: 'object' as type.cast<Filter>,
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
  selectionState: 'object' as type.cast<SelectionState>,
  detailRowIndex: 'number | null',
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
  detailRowIndex: null,
}

export const tablePageStore = memoize(({ id, schema, table }: { id: string, schema: string, table: string }) => {
  const key = `${id}.${schema}-${table}.store`
  const persistedState = JSON.parse(
    sessionStorage.getItem(key)
    || '{}',
  ) as typeof defaultState

  const state = storeState({ ...defaultState, ...persistedState })

  if (import.meta.env.DEV && state instanceof type.errors) {
    console.error('Invalid page store state', state.summary)
  }

  const store = createStore<typeof storeState.infer>(
    state instanceof type.errors ? defaultState : state,
  )

  store.subscribe((state) => {
    sessionStorage.setItem(key, JSON.stringify({
      selected: state.selected,
      filters: state.filters,
      exact: state.exact,
      hiddenColumns: state.hiddenColumns,
      orderBy: state.orderBy,
      prompt: state.prompt,
      columnSizes: state.columnSizes,
    } satisfies Omit<typeof state, 'lastClickedIndex' | 'selectionState' | 'detailRowIndex'>))
  })

  return store
})

export const PageStoreContext = createContext<Store<typeof storeState.infer>>(null!)

export function usePageStoreContext() {
  return use(PageStoreContext)
}
