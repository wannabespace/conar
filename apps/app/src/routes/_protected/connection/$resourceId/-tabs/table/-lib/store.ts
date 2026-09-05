import type { ActiveFilter, Filter } from '@tamery/shared/filters'
import { omit } from '@tamery/shared/utils/helpers'
import { type } from 'arktype'
import { memoize } from 'memoza'
import { createContext, use } from 'react'
import { createWebStorageValue } from 'seitu/web'

import type { GeneratorId } from '~/entities/connection/utils/seeds'

export const tablePageType = type({
  filters: type({
    column: 'string',
    ref: 'object' as type.cast<Filter>,
    values: 'unknown[]',
    'disabled?': 'boolean',
  }).array() as type.cast<ActiveFilter[]>,
  hiddenColumns: 'string[]',
  orderBy: {
    '[string]': '"ASC" | "DESC"',
  },
  prompt: 'string',
  columnSizes: 'Record<string, number>',
  generators: {
    '[string]': {
      generatorId: 'string' as type.cast<GeneratorId>,
      isNullable: 'boolean',
      'customExpression?': 'string',
    },
  },
  seedsCount: 'number',
})

const defaultState: typeof tablePageType.infer = {
  filters: [],
  prompt: '',
  hiddenColumns: [],
  orderBy: {},
  columnSizes: {},
  generators: {},
  seedsCount: 10,
}

export const tablePageStore = memoize(
  ({ id, schema, table }: { id: string; schema: string; table: string }) =>
    createWebStorageValue({
      type: 'localStorage',
      key: `${id}.${schema}-${table}.store`,
      defaultValue: defaultState,
      schema: tablePageType,
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
    setOrder,
    removeOrder,
    toggleOrder,
  }
}
