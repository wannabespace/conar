import { useEffect, useRef } from 'react'
import { useSubscription } from 'seitu/react'

import {
  draftsActions,
  getRowKeyByPrimaryKeys,
  primaryKeysKey,
  useTableSessionStore,
} from './session-store'
import { useTablePageStore } from './store'

export const useClearDraftsOnQueryChange = () => {
  const store = useTablePageStore()
  const sessionStore = useTableSessionStore()
  const filters = useSubscription(store, {
    selector: (state) => state.filters,
  })
  const orderBy = useSubscription(store, {
    selector: (state) => state.orderBy,
  })
  const previousRef = useRef({ store, filters, orderBy })

  useEffect(() => {
    const previous = previousRef.current
    previousRef.current = { store, filters, orderBy }

    if (previous.store !== store) {
      return
    }

    if (previous.filters !== filters || previous.orderBy !== orderBy) {
      draftsActions(sessionStore).clear()
    }
  }, [store, sessionStore, filters, orderBy])
}

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
