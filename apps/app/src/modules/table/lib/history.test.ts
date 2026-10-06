import { expect, mock, test } from 'bun:test'

import type { ActiveFilter } from '@tamery/shared/filters'
import { EQUAL_FILTER } from '@tamery/shared/filters'
import { memoize } from 'memoza'
import { createStore } from 'seitu'

import {
  draftsActions,
  isSaving,
  stagedActions,
  tableSessionStore,
} from '~/core/table/session'

import { stagedHistory } from './history'
import { tablePageStore } from './store'

mock.module('~/lib/posthog', () => ({ posthog: { capture: () => {} } }))
// Bun has no localStorage, so the persisted page store would ignore every write.
mock.module('./store', () => ({
  tablePageStore: memoize((_key: object) =>
    createStore({ filters: [], orderBy: {} })
  ),
}))

const nextTick = () => Promise.resolve()

const setup = (table: string) => {
  const key = { id: 'c', schema: 's', table }
  const store = tableSessionStore(key)
  const history = stagedHistory(key)
  const drafts = draftsActions(store)
  const edit = (id: number, value: string) =>
    drafts.upsert({ columnId: 'name', primaryKeys: { id }, value })
  const values = () =>
    Object.values(store.get().drafts).map((draft) => draft.value)
  return { edit, history, pageStore: tablePageStore(key), store, values }
}

test('edits in one tick undo as one step and redo back', async () => {
  const { edit, history, values } = setup('batch')
  edit(1, 'a')
  await nextTick()
  edit(2, 'b')
  edit(3, 'c')
  await nextTick()

  history.undo()
  expect(values()).toEqual(['a'])
  history.redo()
  expect(values()).toEqual(['a', 'b', 'c'])
})

test('a failed save leaves undo working on the uncommitted drafts', async () => {
  const { edit, history, store, values } = setup('failed-save')
  edit(1, 'a')
  await nextTick()
  edit(2, 'b')
  await nextTick()

  const status = stagedActions(store)
  status.setStatus({ isCommitting: true })
  status.setStatus({ isCommitting: false })
  await nextTick()

  history.undo()
  expect(values()).toEqual(['a'])
  expect(isSaving(store.get())).toBe(false)
})

test('a sort change drops drafts undoably, but never mid-save', async () => {
  const { edit, history, pageStore, store, values } = setup('sort')
  const sortBy = (order: 'ASC' | 'DESC') =>
    pageStore.set((state) => ({ ...state, orderBy: { name: order } }))
  edit(1, 'a')
  await nextTick()

  stagedActions(store).setStatus({ isCommitting: true })
  sortBy('ASC')
  expect(values()).toEqual(['a'])
  stagedActions(store).setStatus({ isCommitting: false })
  await nextTick()

  sortBy('DESC')
  expect(values()).toEqual([])
  history.undo()
  expect(values()).toEqual(['a'])
})

test('a filter added then removed still undoes back to the drafts', async () => {
  const { edit, history, pageStore, values } = setup('filter-round-trip')
  const filterBy = (filters: ActiveFilter[]) =>
    pageStore.set((state) => ({ ...state, filters }))
  edit(1, 'a')
  await nextTick()

  filterBy([{ column: 'name', ref: EQUAL_FILTER, values: ['x'] }])
  await nextTick()
  filterBy([])
  await nextTick()
  expect(values()).toEqual([])
  history.undo()
  expect(values()).toEqual(['a'])
})
