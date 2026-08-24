import type { ActiveFilter, Filter } from '@tamery/shared/filters'
import { omit } from '@tamery/shared/utils/helpers'
import { INITIAL_SHIFT_SELECTION_STATE } from '@tamery/table/hooks'
import { type } from 'arktype'
import { memoize } from 'memoza'
import { createContext, use } from 'react'
import { createWebStorageValue } from 'seitu/web'

import type { GeneratorId } from '~/entities/connection/utils/seeds'

export const primaryKeysType = type('Record<string, unknown>')

export const draftType = type({
  primaryKeys: primaryKeysType,
  columnId: 'string',
  value: 'unknown',
  'error?': 'string',
  'isCommitting?': 'boolean',
})

export const tablePageType = type({
  selected: primaryKeysType.array(),
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
  lastClickedIndex: 'number | null',
  selectionState: {
    anchorIndex: 'number | null',
    focusIndex: 'number | null',
    lastExpandDirection: '"up" | "down" | null',
  },
  drafts: draftType.array(),
})

const defaultState: typeof tablePageType.infer = {
  selected: [],
  filters: [],
  prompt: '',
  hiddenColumns: [],
  orderBy: {},
  columnSizes: {},
  generators: {},
  seedsCount: 10,
  lastClickedIndex: null,
  selectionState: INITIAL_SHIFT_SELECTION_STATE,
  drafts: [],
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

export const primaryKeysKey = (primaryKeys: typeof primaryKeysType.infer) =>
  Object.entries(primaryKeys)
    .toSorted()
    .map(([key, value]) => `${key}=${value}`)
    .join('|')

export const getRowPrimaryKeysValues = (
  row: Record<string, unknown>,
  primaryKeys: string[]
): typeof primaryKeysType.infer => {
  const values: typeof primaryKeysType.infer = {}
  for (const key of primaryKeys) {
    values[key] = row[key]
  }
  return values
}

export const getRowKeyByPrimaryKeys = (
  row: Record<string, unknown>,
  primaryKeys: string[]
) => primaryKeysKey(getRowPrimaryKeysValues(row, primaryKeys))

export const draftKey = (
  primaryKeys: typeof primaryKeysType.infer,
  columnId: string
) => `${primaryKeysKey(primaryKeys)}:${columnId}`

export const draftsActions = (store: TablePageStore) => {
  const upsert = (draft: (typeof tablePageType.infer)['drafts'][number]) => {
    store.set((state) => {
      const key = draftKey(draft.primaryKeys, draft.columnId)
      const existingIndex = state.drafts.findIndex(
        (d) => draftKey(d.primaryKeys, d.columnId) === key
      )

      if (existingIndex === -1) {
        return {
          ...state,
          drafts: [...state.drafts, draft],
        } satisfies typeof state
      }

      const next = [...state.drafts]
      next[existingIndex] = { ...next[existingIndex], ...draft }
      return { ...state, drafts: next } satisfies typeof state
    })
  }

  const remove = (
    primaryKeys: typeof primaryKeysType.infer,
    columnId: string
  ) => {
    store.set(
      (state) =>
        ({
          ...state,
          drafts: state.drafts.filter(
            (d) =>
              draftKey(d.primaryKeys, d.columnId) !==
              draftKey(primaryKeys, columnId)
          ),
        }) satisfies typeof state
    )
  }

  const clear = () => {
    store.set((state) => ({ ...state, drafts: [] }) satisfies typeof state)
  }

  const setRowStatus = (
    primaryKeys: typeof primaryKeysType.infer,
    patch: Partial<
      Pick<
        (typeof tablePageType.infer)['drafts'][number],
        'error' | 'isCommitting'
      >
    >
  ) => {
    store.set(
      (state) =>
        ({
          ...state,
          drafts: state.drafts.map((d) =>
            primaryKeysKey(d.primaryKeys) === primaryKeysKey(primaryKeys)
              ? { ...d, ...patch }
              : d
          ),
        }) satisfies typeof state
    )
  }

  const removeRow = (primaryKeys: typeof primaryKeysType.infer) => {
    store.set(
      (state) =>
        ({
          ...state,
          drafts: state.drafts.filter(
            (d) => primaryKeysKey(d.primaryKeys) !== primaryKeysKey(primaryKeys)
          ),
        }) satisfies typeof state
    )
  }

  return {
    upsert,
    remove,
    clear,
    setRowStatus,
    removeRow,
  }
}
