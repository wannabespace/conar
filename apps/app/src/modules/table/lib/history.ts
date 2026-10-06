import { useHotkeys } from '@tanstack/react-hotkeys'
import { memoize } from 'memoza'

import type { TableSessionState } from '~/core/table/session'
import { isSaving, tableSessionStore } from '~/core/table/session'
import { posthog } from '~/lib/posthog'

import type { tablePageType } from './store'
import { tablePageStore } from './store'

type Staged = Pick<TableSessionState, 'drafts' | 'newRows'>

const stagedOf = ({ drafts, newRows }: TableSessionState): Staged => ({
  drafts,
  newRows,
})

const queryOf = ({ filters, orderBy }: typeof tablePageType.infer) =>
  JSON.stringify([filters, orderBy])

/** Undo/redo over the staged changes; a filter or sort change drops the drafts as an undoable step, staged rows stay. */
export const stagedHistory = memoize(
  (key: { id: string; schema: string; table: string }) => {
    const store = tableSessionStore(key)
    const pageStore = tablePageStore(key)
    let steps = { redo: [] as Staged[], undo: [] as Staged[] }
    let previous = stagedOf(store.get())
    let restoring = false
    let batching = false

    store.subscribe((state) => {
      const next = stagedOf(state)
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

    let query = queryOf(pageStore.get())
    pageStore.subscribe((state) => {
      const next = queryOf(state)
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
      to.push(stagedOf(store.get()))
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
  useHotkeys(
    [
      { callback: history.undo, hotkey: 'Mod+Z' },
      { callback: history.redo, hotkey: 'Mod+Shift+Z' },
    ],
    { ignoreInputs: true }
  )
