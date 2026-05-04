import { useEffect, useRef } from 'react'
import { useSubscription } from 'seitu/react'
import { draftsActions, useTablePageStore } from './-store'

export function useClearDraftsOnQueryChange() {
  const store = useTablePageStore()
  const filters = useSubscription(store, { selector: state => state.filters })
  const orderBy = useSubscription(store, { selector: state => state.orderBy })
  const previousRef = useRef({ store, filters, orderBy })

  useEffect(() => {
    const previous = previousRef.current
    previousRef.current = { store, filters, orderBy }

    if (previous.store !== store)
      return

    if (previous.filters !== filters || previous.orderBy !== orderBy) {
      draftsActions(store).clear()
    }
  }, [store, filters, orderBy])
}

export function useSyncSelectionWithRows(rows: Record<string, unknown>[], primaryColumns: string[]) {
  const store = useTablePageStore()

  useEffect(() => {
    store.set(state => ({
      ...state,
      selected: state.selected.filter(selectedRow =>
        rows.some(row => primaryColumns.every(key => row[key] === selectedRow[key])),
      ),
    } satisfies typeof state))
  }, [store, rows, primaryColumns])
}
