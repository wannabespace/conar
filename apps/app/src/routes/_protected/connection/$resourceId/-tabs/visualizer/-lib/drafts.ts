import { memoize } from 'memoza'
import { nanoid } from 'nanoid'
import { createStore } from 'seitu'

import type { NewColumn } from '~/entities/connection/queries/tables/shape'

import type { DiagramDraft } from './statements'

type Unsaved<T> = T extends unknown ? Omit<T, 'id'> : never

const defaultState = { drafts: [] as DiagramDraft[] }

export const diagramDraftsStore = memoize((_resourceId: string) =>
  createStore(defaultState)
)

type DiagramDraftsStore = ReturnType<typeof diagramDraftsStore>

interface TableRef {
  schema: string
  table: string
}

const sameTable = (draft: DiagramDraft, { schema, table }: TableRef) =>
  draft.schema === schema && draft.table === table

const sameColumn = (
  draft: DiagramDraft,
  ref: TableRef,
  column: string
): draft is Extract<
  DiagramDraft,
  { kind: 'renameColumn' | 'alterColumn' | 'dropColumn' }
> =>
  sameTable(draft, ref) &&
  (draft.kind === 'renameColumn' ||
    draft.kind === 'alterColumn' ||
    draft.kind === 'dropColumn') &&
  draft.column === column

// Edits on a table or column that only exists as a draft fold into the draft
// that creates it, so the statement list stays one CREATE/ADD per object.
export const diagramDrafts = (store: DiagramDraftsStore) => {
  const update = (change: (drafts: DiagramDraft[]) => DiagramDraft[]) =>
    store.set((state) => ({ drafts: change(state.drafts) }))
  const add = (draft: Unsaved<DiagramDraft>) =>
    update((drafts) => [...drafts, { ...draft, id: nanoid(8) }])
  const created = (ref: TableRef) =>
    store
      .get()
      .drafts.find(
        (draft): draft is Extract<DiagramDraft, { kind: 'createTable' }> =>
          draft.kind === 'createTable' && sameTable(draft, ref)
      )
  const added = (ref: TableRef, column: string) =>
    store
      .get()
      .drafts.find(
        (draft): draft is Extract<DiagramDraft, { kind: 'addColumn' }> =>
          draft.kind === 'addColumn' &&
          sameTable(draft, ref) &&
          draft.column.name === column
      )
  const editCreated = (
    ref: TableRef,
    change: (columns: NewColumn[]) => NewColumn[]
  ) =>
    update((drafts) =>
      drafts.map((draft) =>
        draft.kind === 'createTable' && sameTable(draft, ref)
          ? { ...draft, columns: change(draft.columns) }
          : draft
      )
    )
  const editAdded = (
    ref: TableRef,
    column: string,
    change: (column: NewColumn) => NewColumn
  ) =>
    update((drafts) =>
      drafts.map((draft) =>
        draft.kind === 'addColumn' &&
        sameTable(draft, ref) &&
        draft.column.name === column
          ? { ...draft, column: change(draft.column) }
          : draft
      )
    )

  return {
    addColumn: (ref: TableRef, column: NewColumn) => {
      if (created(ref)) {
        editCreated(ref, (columns) => [...columns, column])
        return
      }
      add({ ...ref, column, kind: 'addColumn' })
    },
    addForeignKey: (
      draft: Unsaved<Extract<DiagramDraft, { kind: 'addForeignKey' }>>
    ) => add(draft),
    alterColumn: (
      ref: TableRef,
      column: string,
      shape: { nullable: boolean; type: string },
      original: { nullable: boolean; type: string }
    ) => {
      if (created(ref)) {
        editCreated(ref, (columns) =>
          columns.map((c) => (c.name === column ? { ...c, ...shape } : c))
        )
        return
      }
      if (added(ref, column)) {
        editAdded(ref, column, (c) => ({ ...c, ...shape }))
        return
      }
      update((drafts) => {
        const rest = drafts.filter(
          (draft) =>
            !(sameColumn(draft, ref, column) && draft.kind === 'alterColumn')
        )
        if (
          shape.type === original.type &&
          shape.nullable === original.nullable
        ) {
          return rest
        }
        return [
          ...rest,
          { ...ref, ...shape, column, id: nanoid(8), kind: 'alterColumn' },
        ]
      })
    },
    clear: () => store.set(defaultState),
    createTable: (ref: TableRef, columns: NewColumn[]) =>
      add({ ...ref, columns, kind: 'createTable' }),
    dropColumn: (ref: TableRef, column: string) => {
      if (created(ref)) {
        editCreated(ref, (columns) => columns.filter((c) => c.name !== column))
        return
      }
      update((drafts) => {
        const dropped = drafts.find(
          (draft) =>
            sameColumn(draft, ref, column) && draft.kind === 'dropColumn'
        )
        if (dropped) {
          return drafts.filter((draft) => draft !== dropped)
        }
        return [
          ...drafts.filter(
            (draft) =>
              !sameColumn(draft, ref, column) &&
              !(
                draft.kind === 'addColumn' &&
                sameTable(draft, ref) &&
                draft.column.name === column
              )
          ),
          ...(added(ref, column)
            ? []
            : [{ ...ref, column, id: nanoid(8), kind: 'dropColumn' as const }]),
        ]
      })
    },
    dropForeignKey: (ref: TableRef, name: string) =>
      update((drafts) => {
        const pending = drafts.find(
          (draft) =>
            (draft.kind === 'addForeignKey' ||
              draft.kind === 'dropForeignKey') &&
            sameTable(draft, ref) &&
            draft.name === name
        )
        if (pending) {
          return drafts.filter((draft) => draft !== pending)
        }
        return [
          ...drafts,
          { ...ref, id: nanoid(8), kind: 'dropForeignKey', name },
        ]
      }),
    dropTable: (ref: TableRef, cascade: boolean) =>
      update((drafts) => [
        ...drafts.filter((draft) => !sameTable(draft, ref)),
        ...(drafts.some(
          (draft) => draft.kind === 'createTable' && sameTable(draft, ref)
        )
          ? []
          : [{ ...ref, cascade, id: nanoid(8), kind: 'dropTable' as const }]),
      ]),
    remove: (id: string) =>
      update((drafts) => drafts.filter((draft) => draft.id !== id)),
    renameColumn: (ref: TableRef, column: string, newName: string) => {
      if (created(ref)) {
        editCreated(ref, (columns) =>
          columns.map((c) => (c.name === column ? { ...c, name: newName } : c))
        )
        return
      }
      if (added(ref, column)) {
        editAdded(ref, column, (c) => ({ ...c, name: newName }))
        return
      }
      update((drafts) => {
        const rest = drafts.filter(
          (draft) =>
            !(sameColumn(draft, ref, column) && draft.kind === 'renameColumn')
        )
        if (newName === column) {
          return rest
        }
        return [
          ...rest,
          { ...ref, column, id: nanoid(8), kind: 'renameColumn', newName },
        ]
      })
    },
    renameTable: (ref: TableRef, newName: string) => {
      if (created(ref)) {
        update((drafts) =>
          drafts.map((draft) =>
            sameTable(draft, ref) ? { ...draft, table: newName } : draft
          )
        )
        return
      }
      update((drafts) => {
        const rest = drafts.filter(
          (draft) => !(draft.kind === 'renameTable' && sameTable(draft, ref))
        )
        if (newName === ref.table) {
          return rest
        }
        return [
          ...rest,
          { ...ref, id: nanoid(8), kind: 'renameTable', newName },
        ]
      })
    },
    restoreTable: (ref: TableRef) =>
      update((drafts) =>
        drafts.filter(
          (draft) => !(draft.kind === 'dropTable' && sameTable(draft, ref))
        )
      ),
  }
}
