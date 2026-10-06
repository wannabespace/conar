import { useHotkeys } from '@tanstack/react-hotkeys'
import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'
import { useSubscription } from 'seitu/react'

import type { TableSessionState } from '~/core/table/session'
import { draftsActions, useTableSessionStore } from '~/core/table/session'

import { useTablePageStore } from './store'

type Staged = Pick<TableSessionState, 'drafts' | 'newRows'>

const stagedOf = ({ drafts, newRows }: TableSessionState): Staged => ({
  drafts,
  newRows,
})

const isSaving = ({ drafts, newRows }: Staged) =>
  Object.values(drafts).some((draft) => draft.isCommitting) ||
  newRows.some((row) => row.isCommitting)

/** ⌘Z / ⇧⌘Z over staged edits. Whatever one action stages synchronously (a paste, a fill) is one step; a save starts a fresh history; a filter or sort change drops the edits with it. */
export const useDraftHistory = (target: RefObject<HTMLElement | null>) => {
  const store = useTableSessionStore()
  const pageStore = useTablePageStore()
  const filters = useSubscription(pageStore, {
    selector: (state) => state.filters,
  })
  const orderBy = useSubscription(pageStore, {
    selector: (state) => state.orderBy,
  })
  const steps = useRef({ redo: [] as Staged[], undo: [] as Staged[] })
  const restoring = useRef(false)
  const query = useRef({ filters, orderBy, pageStore })

  useEffect(() => {
    const previous = query.current
    query.current = { filters, orderBy, pageStore }
    if (
      previous.pageStore === pageStore &&
      (previous.filters !== filters || previous.orderBy !== orderBy)
    ) {
      draftsActions(store).clear()
      steps.current = { redo: [], undo: [] }
    }
  }, [store, pageStore, filters, orderBy])

  useEffect(() => {
    let previous = stagedOf(store.get())
    let batching = false
    return store.subscribe((state) => {
      const next = stagedOf(state)
      if (
        next.drafts === previous.drafts &&
        next.newRows === previous.newRows
      ) {
        return
      }
      if (isSaving(next) || isSaving(previous)) {
        steps.current = { redo: [], undo: [] }
      } else if (!restoring.current && !batching) {
        steps.current.undo.push(previous)
        steps.current.redo = []
        batching = true
        queueMicrotask(() => {
          batching = false
        })
      }
      previous = next
    })
  }, [store])

  const restore = (from: Staged[], to: Staged[]) => {
    const staged = from.pop()
    if (!staged) {
      return
    }
    to.push(stagedOf(store.get()))
    restoring.current = true
    store.set((state) => ({ ...state, ...staged }))
    restoring.current = false
  }

  useHotkeys(
    [
      {
        callback: () => restore(steps.current.undo, steps.current.redo),
        hotkey: 'Mod+Z',
      },
      {
        callback: () => restore(steps.current.redo, steps.current.undo),
        hotkey: 'Mod+Shift+Z',
      },
    ],
    { ignoreInputs: true, target }
  )
}
