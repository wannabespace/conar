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

// Must match the flash overlay's duration-1500 in core/table/cell/cell.tsx.
const CELL_FLASH_DURATION_MS = 1500

export const useSyncSelectionWithRows = (
  rows: Record<string, unknown>[],
  primaryColumns: string[]
) => {
  const store = useTableSessionStore()

  useEffect(() => {
    const rowKeys = new Set(
      rows.map((row) => getRowKeyByPrimaryKeys(row, primaryColumns))
    )
    store.set((state) => ({
      ...state,
      selected: state.selected.filter((selectedRow) =>
        rowKeys.has(primaryKeysKey(selectedRow))
      ),
    }))
  }, [store, rows, primaryColumns])
}

// null, '' and DEFAULT (`undefined`) share one editor text and must stay distinct.
export const isSameValue = (
  a: unknown,
  b: unknown,
  toText: (value: unknown) => string = getValueForEditor
) =>
  a === b ||
  (a !== null &&
    a !== undefined &&
    b !== null &&
    b !== undefined &&
    toText(a) === toText(b))

export const useFlashChangedCells = (
  rows: Record<string, unknown>[],
  primaryColumns: string[]
) => {
  const store = useTableSessionStore()
  const previousRef = useRef<Map<string, Record<string, unknown>>>(null)
  const flash = useSubscription(store, { selector: (state) => state.flash })

  useEffect(() => {
    if (!flash) {
      return
    }
    const clearFlash = () => {
      store.set((state) =>
        state.flash === flash ? { ...state, flash: null } : state
      )
    }
    const timeout = setTimeout(clearFlash, CELL_FLASH_DURATION_MS)
    return () => {
      clearTimeout(timeout)
      clearFlash()
    }
  }, [store, flash])

  useEffect(() => {
    if (primaryColumns.length === 0) {
      return
    }
    const byKey = new Map(
      rows.map((row) => [getRowKeyByPrimaryKeys(row, primaryColumns), row])
    )
    const previous = previousRef.current
    previousRef.current = byKey
    const keys = new Set<string>()
    for (const [rowKey, row] of byKey) {
      const before = previous?.get(rowKey)
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
  }, [store, rows, primaryColumns])
}
