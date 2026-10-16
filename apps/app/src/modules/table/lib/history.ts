import { memoize } from 'memoza'

import { useShortcuts } from '~/core/keyboard/use-shortcuts'
import type { TableSessionState } from '~/core/table/session'
import { isSaving, tableSessionStore } from '~/core/table/session'
import { posthog } from '~/lib/posthog'

import type { tablePageType } from './store'
import { tablePageStore } from './store'

type Staged = Pick<TableSessionState, 'drafts' | 'newRows'>

const getStaged = ({ drafts, newRows }: TableSessionState): Staged => ({
  drafts,
  newRows,
})

const getQuery = ({ filters, orderBy }: typeof tablePageType.infer) =>
  JSON.stringify([filters, orderBy])

export const stagedHistory = memoize(
  (key: { id: string; schema: string; table: string }) => {
    const store = tableSessionStore(key)
    const pageStore = tablePageStore(key)
    let steps = { redo: [] as Staged[], undo: [] as Staged[] }
    let previous = getStaged(store.get())
    let restoring = false
    let batching = false

    store.subscribe((state) => {
      const next = getStaged(state)
      if (
        next.drafts === previous.drafts &&
        next.newRows === previous.newRows
      ) {
        return
      }
      if (!restoring && !batching && !isSaving(previous) && !isSaving(next)) {
        steps.undo.push(previous)
        steps.redo = []
        batching = true
        queueMicrotask(() => {
          batching = false
        })
      }
      previous = next
    })

    let query = getQuery(pageStore.get())
    pageStore.subscribe((state) => {
      const next = getQuery(state)
      if (next === query) {
        return
      }
      query = next
      const staged = store.get()
      if (Object.keys(staged.drafts).length > 0 && !isSaving(staged)) {
        store.set((current) => ({ ...current, drafts: {} }))
      }
    })

    const restore = (from: Staged[], to: Staged[]) => {
      if (isSaving(store.get())) {
        return
      }
      const staged = from.pop()
      if (!staged) {
        return
      }
      posthog.capture(from === steps.undo ? 'drafts_undone' : 'drafts_redone')
      to.push(getStaged(store.get()))
      restoring = true
      store.set((state) => ({ ...state, ...staged }))
      restoring = false
    }

    return {
      redo: () => restore(steps.redo, steps.undo),
      reset: () => {
        steps = { redo: [], undo: [] }
      },
      undo: () => restore(steps.undo, steps.redo),
    }
  }
)

// App-wide, not on the grid: removing a filter chip unmounts the focused control, and only the active tab's table is mounted.
export const useStagedHistoryHotkeys = (
  history: ReturnType<typeof stagedHistory>
) =>
  useShortcuts(
    [
      { callback: history.undo, shortcut: 'undo' },
      { callback: history.redo, shortcut: 'redo' },
    ],
    { ignoreInputs: true }
  )
