import { useEffect, useRef } from 'react'
import { useSubscription } from 'seitu/react'

import { getValueForEditor } from '~/core/connection/utils'
import {
  draftKey,
  getRowKeyByPrimaryKeys,
  getRowPrimaryKeysValues,
  primaryKeysKey,
  useTableSessionStore,
} from '~/core/table/session'

import { useTablePageStore } from './store'

export const useSyncSelectionWithRows = (
  rows: Record<string, unknown>[],
  primaryColumns: string[]
) => {
  const store = useTableSessionStore()

  useEffect(() => {
    const rowKeys = new Set(
      rows.map((row) => getRowKeyByPrimaryKeys(row, primaryColumns))
    )
    store.set(
      (state) =>
        ({
          ...state,
          selected: state.selected.filter((selectedRow) =>
            rowKeys.has(primaryKeysKey(selectedRow))
          ),
        }) satisfies typeof state
    )
  }, [store, rows, primaryColumns])
}

// Editors hand back text (`"700"`, pretty-printed JSON), so compare in the
// editor's form; null, '' and DEFAULT (`undefined`) share that form and must stay distinct.
export const isSameValue = (a: unknown, b: unknown) =>
  a === b ||
  (a !== null &&
    a !== undefined &&
    b !== null &&
    b !== undefined &&
    getValueForEditor(a) === getValueForEditor(b))

export const useFlashChangedCells = (
  rows: Record<string, unknown>[],
  primaryColumns: string[]
) => {
  const store = useTableSessionStore()
  const pageStore = useTablePageStore()
  const filters = useSubscription(pageStore, {
    selector: (state) => state.filters,
  })
  const orderBy = useSubscription(pageStore, {
    selector: (state) => state.orderBy,
  })
  const previousRef = useRef<{
    byKey: Map<string, Record<string, unknown>>
    filters: unknown
    orderBy: unknown
  } | null>(null)

  useEffect(() => {
    const byKey = new Map(
      rows.map((row) => [getRowKeyByPrimaryKeys(row, primaryColumns), row])
    )
    const previous = previousRef.current
    previousRef.current = { byKey, filters, orderBy }
    if (
      !previous ||
      previous.filters !== filters ||
      previous.orderBy !== orderBy ||
      primaryColumns.length === 0
    ) {
      return
    }
    const keys = new Set<string>()
    for (const [rowKey, row] of byKey) {
      const before = previous.byKey.get(rowKey)
      if (!before || before === row) {
        continue
      }
      for (const column of Object.keys(row)) {
        if (!isSameValue(before[column], row[column])) {
          keys.add(
            draftKey(getRowPrimaryKeysValues(row, primaryColumns), column)
          )
        }
      }
    }
    if (keys.size > 0) {
      store.set((state) => ({ ...state, flash: { at: Date.now(), keys } }))
    }
  }, [store, rows, primaryColumns, filters, orderBy])
}
