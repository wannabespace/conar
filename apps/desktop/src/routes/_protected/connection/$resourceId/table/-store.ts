import type { ActiveFilter, Filter } from '@conar/shared/filters'
import type { GeneratorId } from '~/entities/connection/utils/seeds'
import { memoize } from '@conar/memoize'
import { omit } from '@conar/shared/utils/helpers'
import { type } from 'arktype'
import { createContext, use } from 'react'
import { repairValueObjectWithDefault } from 'seitu/utils'
import { createWebStorageValue } from 'seitu/web'

export interface SelectionState {
  anchorIndex: number | null
  focusIndex: number | null
  lastExpandDirection: 'up' | 'down' | null
}

export interface TableDraft {
  rowIndex: number
  columnId: string
  value: unknown
  error?: string
  isCommitting?: boolean
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
  lastClickedIndex: 'number | null',
  selectionState: 'object' as type.cast<SelectionState>,
  drafts: 'object[]' as type.cast<TableDraft[]>,
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
  lastClickedIndex: null,
  selectionState: { anchorIndex: null, focusIndex: null, lastExpandDirection: null },
  drafts: [],
}

export const tablePageStore = memoize(({ id, schema, table }: { id: string, schema: string, table: string }) => createWebStorageValue({
  type: 'localStorage',
  key: `${id}.${schema}-${table}.store`,
  defaultValue: defaultState,
  schema: storeState,
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

export function draftKey(rowIndex: number, columnId: string) {
  return `${rowIndex}:${columnId}`
}

export function draftsActions(store: TablePageStore) {
  const upsert = (draft: TableDraft) => {
    store.set((state) => {
      const key = draftKey(draft.rowIndex, draft.columnId)
      const existingIndex = state.drafts.findIndex(d => draftKey(d.rowIndex, d.columnId) === key)

      if (existingIndex === -1) {
        return { ...state, drafts: [...state.drafts, draft] } satisfies typeof state
      }

      const next = [...state.drafts]
      next[existingIndex] = { ...next[existingIndex], ...draft }
      return { ...state, drafts: next } satisfies typeof state
    })
  }

  const remove = (rowIndex: number, columnId: string) => {
    store.set(state => ({
      ...state,
      drafts: state.drafts.filter(d => draftKey(d.rowIndex, d.columnId) !== draftKey(rowIndex, columnId)),
    } satisfies typeof state))
  }

  const clear = () => {
    store.set(state => ({ ...state, drafts: [] } satisfies typeof state))
  }

  const setRowStatus = (rowIndex: number, patch: Partial<Pick<TableDraft, 'error' | 'isCommitting'>>) => {
    store.set(state => ({
      ...state,
      drafts: state.drafts.map(d => d.rowIndex === rowIndex ? { ...d, ...patch } : d),
    } satisfies typeof state))
  }

  const removeRow = (rowIndex: number) => {
    store.set(state => ({
      ...state,
      drafts: state.drafts.filter(d => d.rowIndex !== rowIndex),
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
