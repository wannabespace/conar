import type { ActiveFilter, Filter } from '@conar/shared/filters'
import type { WebStorageValue } from 'seitu/web'
import type { GeneratorId } from '~/entities/connection/utils/seeds'
import { memoize } from '@conar/memoize'
import { omit } from '@conar/shared/utils/helpers'
import { type } from 'arktype'
import { createContext, use } from 'react'
import { createSchemaStore } from 'seitu'
import { repairValueObjectWithDefault } from 'seitu/utils'
import { createWebStorageValue } from 'seitu/web'

export interface SelectionState {
  anchorIndex: number | null
  focusIndex: number | null
  lastExpandDirection: 'up' | 'down' | null
}

export const storeState = type({
  selected: 'Record<string, unknown>[]',
  filters: type({
    column: 'string',
    ref: 'object' as type.cast<Filter>,
    values: 'unknown[]',
  }).array() as type.cast<ActiveFilter[]>,
  exact: 'boolean',
  hiddenColumns: 'string[]',
  orderBy: {
    '[string]': '"ASC" | "DESC"',
  },
  prompt: 'string',
  columnSizes: 'Record<string, number>',
  generators: {
    '[string]': {
      'generatorId': 'string' as type.cast<GeneratorId>,
      'isNullable': 'boolean',
      'customExpression?': 'string',
    },
  },
})

const defaultState: typeof storeState.infer = {
  selected: [],
  filters: [],
  exact: false,
  prompt: '',
  hiddenColumns: [],
  orderBy: {},
  columnSizes: {},
  generators: {},
}

export type TablePageStore = WebStorageValue<typeof storeState.infer>

export const tablePageStore = memoize(({ id, schema, table }: { id: string, schema: string, table: string }): TablePageStore => createWebStorageValue({
  type: 'localStorage',
  key: `${id}.${schema}-${table}.store`,
  defaultValue: defaultState,
  schema: storeState,
  onValidationError: repairValueObjectWithDefault,
}))

export const TablePageStoreContext = createContext<TablePageStore>(null!)

export function columnsOrder(store: TablePageStore) {
  const setOrder = (columnId: string, order: 'ASC' | 'DESC') => {
    store.set(state => ({
      ...state,
      orderBy: {
        ...state.orderBy,
        [columnId]: order,
      },
    } satisfies typeof state))
  }

  const removeOrder = (columnId: string) => {
    store.set(state => ({
      ...state,
      orderBy: omit(state.orderBy, [columnId]),
    } satisfies typeof state))
  }

  const toggleOrder = (columnId: string) => {
    const currentOrder = store.get().orderBy?.[columnId]

    if (currentOrder === 'ASC') {
      setOrder(columnId, 'DESC')
    }
    else if (currentOrder === 'DESC') {
      removeOrder(columnId)
    }
    else {
      setOrder(columnId, 'ASC')
    }
  }

  return {
    setOrder,
    removeOrder,
    toggleOrder,
  }
}

export function useTablePageStore() {
  return use(TablePageStoreContext)
}

export const tablePageSelectionStore = memoize((_: { id: string, schema: string, table: string }) => createSchemaStore({
  schema: type({
    lastClickedIndex: 'number | null',
    selectionState: 'object' as type.cast<SelectionState>,
  }),
  defaultValue: {
    lastClickedIndex: null,
    selectionState: { anchorIndex: null, focusIndex: null, lastExpandDirection: null },
  },
}))

export const TablePageSelectionStoreContext = createContext<ReturnType<typeof tablePageSelectionStore>>(null!)

export function useTablePageSelectionStore() {
  return use(TablePageSelectionStoreContext)
}
