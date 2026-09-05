import { omit } from '@tamery/shared/utils/helpers'
import type { ShiftSelectionState } from '@tamery/table/hooks'
import { INITIAL_SHIFT_SELECTION_STATE } from '@tamery/table/hooks'
import { memoize } from 'memoza'
import { createContext, use } from 'react'
import { createStore } from 'seitu'

export type PrimaryKeys = Record<string, unknown>

export interface Draft {
  primaryKeys: PrimaryKeys
  columnId: string
  value: unknown
  error?: string
  isCommitting?: boolean
}

export interface TableSessionState {
  drafts: Record<string, Draft>
  lastClickedIndex: number | null
  selected: PrimaryKeys[]
  selectionState: ShiftSelectionState
}

const defaultSessionState: TableSessionState = {
  drafts: {},
  lastClickedIndex: null,
  selected: [],
  selectionState: INITIAL_SHIFT_SELECTION_STATE,
}

export const tableSessionStore = memoize(
  (_key: { id: string; schema: string; table: string }) =>
    createStore(defaultSessionState)
)

type TableSessionStore = ReturnType<typeof tableSessionStore>

export const TableSessionStoreContext = createContext<TableSessionStore | null>(
  null
)

export const useTableSessionStore = () => {
  const store = use(TableSessionStoreContext)
  if (!store) {
    throw new Error('TableSessionStoreContext is not provided')
  }
  return store
}

export const primaryKeysKey = (primaryKeys: PrimaryKeys) =>
  Object.entries(primaryKeys)
    .toSorted()
    .map(([key, value]) => `${key}=${value}`)
    .join('|')

export const getRowPrimaryKeysValues = (
  row: Record<string, unknown>,
  primaryKeys: string[]
): PrimaryKeys => {
  const values: PrimaryKeys = {}
  for (const key of primaryKeys) {
    values[key] = row[key]
  }
  return values
}

export const getRowKeyByPrimaryKeys = (
  row: Record<string, unknown>,
  primaryKeys: string[]
) => primaryKeysKey(getRowPrimaryKeysValues(row, primaryKeys))

export const draftKey = (primaryKeys: PrimaryKeys, columnId: string) =>
  `${primaryKeysKey(primaryKeys)}:${columnId}`

export const draftsActions = (store: TableSessionStore) => {
  const setDrafts = (
    update: (drafts: Record<string, Draft>) => Record<string, Draft>
  ) => {
    store.set((state) => ({ ...state, drafts: update(state.drafts) }))
  }

  const updateRow = (
    primaryKeys: PrimaryKeys,
    update: (draft: Draft) => Draft | null
  ) => {
    const rowKey = primaryKeysKey(primaryKeys)
    setDrafts((drafts) =>
      Object.fromEntries(
        Object.entries(drafts).flatMap(([key, draft]) => {
          if (primaryKeysKey(draft.primaryKeys) !== rowKey) {
            return [[key, draft]]
          }
          const next = update(draft)
          return next ? [[key, next]] : []
        })
      )
    )
  }

  const upsert = (draft: Draft) => {
    const key = draftKey(draft.primaryKeys, draft.columnId)
    setDrafts((drafts) => ({ ...drafts, [key]: { ...drafts[key], ...draft } }))
  }

  const remove = (primaryKeys: PrimaryKeys, columnId: string) => {
    setDrafts((drafts) => omit(drafts, [draftKey(primaryKeys, columnId)]))
  }

  const clear = () => {
    setDrafts(() => ({}))
  }

  const setRowStatus = (
    primaryKeys: PrimaryKeys,
    patch: Partial<Pick<Draft, 'error' | 'isCommitting'>>
  ) => {
    updateRow(primaryKeys, (draft) => ({ ...draft, ...patch }))
  }

  const removeRow = (primaryKeys: PrimaryKeys) => {
    updateRow(primaryKeys, () => null)
  }

  return {
    upsert,
    remove,
    clear,
    setRowStatus,
    removeRow,
  }
}
