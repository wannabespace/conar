import { useEffect } from 'react'
import { useSubscription } from 'seitu/react'
import { useOnChange } from '~/hooks/use-on-change'
import { draftsActions, useTablePageStore } from './-store'

export function useClearDraftsOnQueryChange() {
  const store = useTablePageStore()
  const filters = useSubscription(store, { selector: state => state.filters })
  const orderBy = useSubscription(store, { selector: state => state.orderBy })
  const { clear } = draftsActions(store)

  useOnChange(filters, clear)
  useOnChange(orderBy, clear)
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
