import { omit } from '@tamery/shared/utils'
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

export interface NewRow {
  id: string
  values: Record<string, unknown>
  error?: string
  isCommitting?: boolean
}

export interface TableSessionState {
  drafts: Record<string, Draft>
  /** Cells (by `draftKey`) whose values changed in the latest refetch; `at` re-keys the flash so a second change replays it. */
  flash: { at: number; keys: ReadonlySet<string> } | null
  lastClickedIndex: number | null
  /** Staged inserts, newest first; they lead the grid, so a grid row index below `newRows.length` is its index here. */
  newRows: NewRow[]
  selected: PrimaryKeys[]
  /** The Shift+↑/↓ row range: where it started and where it reaches. */
  selectionState: { anchorIndex: number | null; focusIndex: number | null }
}

const defaultSessionState: TableSessionState = {
  drafts: {},
  flash: null,
  lastClickedIndex: null,
  newRows: [],
  selected: [],
  selectionState: { anchorIndex: null, focusIndex: null },
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
    store.set((state) => ({ ...state, drafts: {}, newRows: [] }))
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
    clear,
    remove,
    removeRow,
    setRowStatus,
    upsert,
  }
}

export const newRowsActions = (store: TableSessionStore) => {
  const update = (id: string, patch: (row: NewRow) => NewRow | null) =>
    store.set((state) => ({
      ...state,
      newRows: state.newRows.flatMap((row) => {
        if (row.id !== id) {
          return [row]
        }
        const next = patch(row)
        return next ? [next] : []
      }),
    }))

  return {
    add: (values: Record<string, unknown>) =>
      store.set((state) => ({
        ...state,
        newRows: [{ id: crypto.randomUUID(), values }, ...state.newRows],
      })),
    remove: (id: string) => update(id, () => null),
    setStatus: (
      id: string,
      status: Partial<Pick<NewRow, 'error' | 'isCommitting'>>
    ) => update(id, (row) => ({ ...row, ...status })),
    setValue: (id: string, columnId: string, value: unknown) =>
      update(id, (row) => ({
        ...row,
        error: undefined,
        values: { ...row.values, [columnId]: value },
      })),
  }
}
