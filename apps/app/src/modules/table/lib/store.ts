import type { ActiveFilter, Filter } from '@tamery/shared/filters'
import { omit } from '@tamery/shared/utils'
import { type } from 'arktype'
import { memoize } from 'memoza'
import { createContext, use } from 'react'
import { createWebStorageValue } from 'seitu/web'

import type { GeneratorId } from '../seeds/registry'

export const tablePageType = type({
  columnSizes: 'Record<string, number>',
  filters: type({
    column: 'string',
    'disabled?': 'boolean',
    ref: 'object' as type.cast<Filter>,
    values: 'unknown[]',
  }).array() as type.cast<ActiveFilter[]>,
  generators: {
    '[string]': {
      'customExpression?': 'string',
      generatorId: 'string' as type.cast<GeneratorId>,
      isNullable: 'boolean',
    },
  },
  hiddenColumns: 'string[]',
  orderBy: {
    '[string]': '"ASC" | "DESC"',
  },
  prompt: 'string',
  seedsCount: 'number',
})

const defaultState: typeof tablePageType.infer = {
  columnSizes: {},
  filters: [],
  generators: {},
  hiddenColumns: [],
  orderBy: {},
  prompt: '',
  seedsCount: 10,
}

export const tablePageStore = memoize(
  ({ id, schema, table }: { id: string; schema: string; table: string }) =>
    createWebStorageValue({
      defaultValue: defaultState,
      key: `${id}.${schema}-${table}.store`,
      schema: tablePageType,
      type: 'localStorage',
    })
)

type TablePageStore = ReturnType<typeof tablePageStore>

export const TablePageStoreContext = createContext<TablePageStore | null>(null)

export const useTablePageStore = () => {
  const store = use(TablePageStoreContext)
  if (!store) {
    throw new Error('TablePageStoreContext is not provided')
  }
  return store
}

export const columnsOrder = (store: TablePageStore) => {
  const setOrder = (columnId: string, order: 'ASC' | 'DESC') => {
    store.set(
      (state) =>
        ({
          ...state,
          orderBy: {
            ...state.orderBy,
            [columnId]: order,
          },
        }) satisfies typeof state
    )
  }

  const removeOrder = (columnId: string) => {
    store.set(
      (state) =>
        ({
          ...state,
          orderBy: omit(state.orderBy, [columnId]),
        }) satisfies typeof state
    )
  }

  const toggleOrder = (columnId: string) => {
    const currentOrder = store.get().orderBy?.[columnId]

    if (currentOrder === 'ASC') {
      setOrder(columnId, 'DESC')
    } else if (currentOrder === 'DESC') {
      removeOrder(columnId)
    } else {
      setOrder(columnId, 'ASC')
    }
  }

  return {
    removeOrder,
    setOrder,
    toggleOrder,
  }
}
