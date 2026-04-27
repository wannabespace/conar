import type { ActiveFilter, Filter } from '@conar/shared/filters'
import type { GeneratorId } from '~/entities/connection/utils/seeds'
import { memoize } from '@conar/memoize'
import { omit } from '@conar/shared/utils/helpers'
import { INITIAL_SHIFT_SELECTION_STATE } from '@conar/table/hooks'
import { type } from 'arktype'
import { createContext, use } from 'react'
import { repairValueObjectWithDefault } from 'seitu/utils'
import { createWebStorageValue } from 'seitu/web'

export const primaryKeysType = type('Record<string, unknown>')

export const draftType = type({
  'primaryKeys': primaryKeysType,
  'columnId': 'string',
  'value': 'unknown',
  'error?': 'string',
  'isCommitting?': 'boolean',
})

export const tablePageType = type({
  selected: primaryKeysType.array(),
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
  exact: false,
  prompt: '',
  hiddenColumns: [],
  orderBy: {},
  columnSizes: {},
  generators: {},
  lastClickedIndex: null,
  selectionState: INITIAL_SHIFT_SELECTION_STATE,
  drafts: [],
}

export const tablePageStore = memoize(({ id, schema, table }: { id: string, schema: string, table: string }) => createWebStorageValue({
  type: 'localStorage',
  key: `${id}.${schema}-${table}.store`,
  defaultValue: defaultState,
  schema: tablePageType,
  onValidationError: repairValueObjectWithDefault,
}))

type TablePageStore = ReturnType<typeof tablePageStore>

export const TablePageStoreContext = createContext<TablePageStore>(null!)

export function useTablePageStore() {
  return use(TablePageStoreContext)
}

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

export function primaryKeysKey(primaryKeys: typeof primaryKeysType.infer) {
  return Object.entries(primaryKeys)
    .toSorted()
    .map(([key, value]) => `${key}=${value}`)
    .join('|')
}

export function getRowPrimaryKeysValues(row: Record<string, unknown>, primaryKeys: string[]): typeof primaryKeysType.infer {
  return primaryKeys.reduce<typeof primaryKeysType.infer>((acc, key) => {
    acc[key] = row[key]
    return acc
  }, {})
}

export function getRowKeyByPrimaryKeys(row: Record<string, unknown>, primaryKeys: string[]) {
  return primaryKeysKey(getRowPrimaryKeysValues(row, primaryKeys))
}

export function draftKey(primaryKeys: typeof primaryKeysType.infer, columnId: string) {
  return `${primaryKeysKey(primaryKeys)}:${columnId}`
}

export function draftsActions(store: TablePageStore) {
  const upsert = (draft: typeof tablePageType.infer['drafts'][number]) => {
    store.set((state) => {
      const key = draftKey(draft.primaryKeys, draft.columnId)
      const existingIndex = state.drafts.findIndex(d => draftKey(d.primaryKeys, d.columnId) === key)

      if (existingIndex === -1) {
        return { ...state, drafts: [...state.drafts, draft] } satisfies typeof state
      }

      const next = [...state.drafts]
      next[existingIndex] = { ...next[existingIndex], ...draft }
      return { ...state, drafts: next } satisfies typeof state
    })
  }

  const remove = (primaryKeys: typeof primaryKeysType.infer, columnId: string) => {
    store.set(state => ({
      ...state,
      drafts: state.drafts.filter(d => draftKey(d.primaryKeys, d.columnId) !== draftKey(primaryKeys, columnId)),
    } satisfies typeof state))
  }

  const clear = () => {
    store.set(state => ({ ...state, drafts: [] } satisfies typeof state))
  }

  const setRowStatus = (primaryKeys: typeof primaryKeysType.infer, patch: Partial<Pick<typeof tablePageType.infer['drafts'][number], 'error' | 'isCommitting'>>) => {
    store.set(state => ({
      ...state,
      drafts: state.drafts.map(d => primaryKeysKey(d.primaryKeys) === primaryKeysKey(primaryKeys) ? { ...d, ...patch } : d),
    } satisfies typeof state))
  }

  const removeRow = (primaryKeys: typeof primaryKeysType.infer) => {
    store.set(state => ({
      ...state,
      drafts: state.drafts.filter(d => primaryKeysKey(d.primaryKeys) !== primaryKeysKey(primaryKeys)),
    } satisfies typeof state))
  }

  return {
    upsert,
    remove,
    clear,
    setRowStatus,
    removeRow,
  }
}
