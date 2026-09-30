import { memoize } from 'memoza'
import { nanoid } from 'nanoid'
import { createStore } from 'seitu'

import type {
  ColumnDefinition,
  NewColumn,
} from '~/entities/connection/queries/tables/shape'

import type { DiagramDraft } from './statements'

type Unsaved<T> = T extends unknown ? Omit<T, 'id'> : never

type ForeignKeyDraft = Extract<DiagramDraft, { kind: 'addForeignKey' }>

export const diagramDraftsStore = memoize((_resourceId: string) =>
  createStore<{ drafts: DiagramDraft[] }>({ drafts: [] })
)

type DiagramDraftsStore = ReturnType<typeof diagramDraftsStore>

interface TableRef {
  schema: string
  table: string
}

const sameTable = (draft: TableRef, { schema, table }: TableRef) =>
  draft.schema === schema && draft.table === table

const sameColumn = (draft: DiagramDraft, ref: TableRef, column: string) =>
  sameTable(draft, ref) &&
  (draft.kind === 'renameColumn' ||
    draft.kind === 'alterColumn' ||
    draft.kind === 'dropColumn') &&
  draft.column === column

const foreignRef = (draft: ForeignKeyDraft): TableRef => ({
  schema: draft.foreignSchema,
  table: draft.foreignTable,
})

// A pending foreign key whose source or target table (or column) is gone.
const linksTo = (draft: DiagramDraft, ref: TableRef, column?: string) =>
  draft.kind === 'addForeignKey' &&
  ((sameTable(draft, ref) &&
    (column === undefined || draft.columns.includes(column))) ||
    (sameTable(foreignRef(draft), ref) &&
      (column === undefined || draft.foreignColumns.includes(column))))

const renameIn = (names: string[], from: string, to: string) =>
  names.map((name) => (name === from ? to : name))

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
      .drafts.some(
        (draft) => draft.kind === 'createTable' && sameTable(draft, ref)
      )
  const added = (ref: TableRef, column: string) =>
    store
      .get()
      .drafts.some(
        (draft) =>
          draft.kind === 'addColumn' &&
          sameTable(draft, ref) &&
          draft.column.name === column
      )
  const editNew = (
    ref: TableRef,
    column: string,
    change: (column: NewColumn) => NewColumn
  ) =>
    update((drafts) =>
      drafts.map((draft) => {
        if (draft.kind === 'createTable' && sameTable(draft, ref)) {
          return {
            ...draft,
            columns: draft.columns.map((c) =>
              c.name === column ? change(c) : c
            ),
          }
        }
        if (
          draft.kind === 'addColumn' &&
          sameTable(draft, ref) &&
          draft.column.name === column
        ) {
          return { ...draft, column: change(draft.column) }
        }
        return draft
      })
    )
  const withoutTable = (drafts: DiagramDraft[], ref: TableRef) =>
    drafts.filter((draft) => !sameTable(draft, ref) && !linksTo(draft, ref))

  return {
    addColumn: (ref: TableRef, column: NewColumn) => {
      if (created(ref)) {
        update((drafts) =>
          drafts.map((draft) =>
            draft.kind === 'createTable' && sameTable(draft, ref)
              ? { ...draft, columns: [...draft.columns, column] }
              : draft
          )
        )
        return
      }
      add({ ...ref, column, kind: 'addColumn' })
    },
    addForeignKey: (draft: Unsaved<ForeignKeyDraft>) => add(draft),
    alterColumn: (
      ref: TableRef,
      column: string,
      shape: { nullable: boolean; type: string },
      original: ColumnDefinition
    ) => {
      if (created(ref) || added(ref, column)) {
        editNew(ref, column, (c) => ({ ...c, ...shape }))
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
          {
            ...ref,
            ...shape,
            column,
            id: nanoid(8),
            kind: 'alterColumn',
            original,
          },
        ]
      })
    },
    clear: () => store.set({ drafts: [] }),
    createTable: (ref: TableRef, columns: NewColumn[]) =>
      add({ ...ref, columns, kind: 'createTable' }),
    dropColumn: (ref: TableRef, column: string) =>
      update((drafts) => {
        const dropped = drafts.find(
          (draft) =>
            sameColumn(draft, ref, column) && draft.kind === 'dropColumn'
        )
        if (dropped) {
          return drafts.filter((draft) => draft !== dropped)
        }
        const rest = drafts
          .filter(
            (draft) =>
              !sameColumn(draft, ref, column) &&
              !linksTo(draft, ref, column) &&
              !(
                draft.kind === 'addColumn' &&
                sameTable(draft, ref) &&
                draft.column.name === column
              )
          )
          .map((draft) =>
            draft.kind === 'createTable' && sameTable(draft, ref)
              ? {
                  ...draft,
                  columns: draft.columns.filter((c) => c.name !== column),
                }
              : draft
          )
        return created(ref) || added(ref, column)
          ? rest
          : [...rest, { ...ref, column, id: nanoid(8), kind: 'dropColumn' }]
      }),
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
        ...withoutTable(drafts, ref),
        ...(created(ref)
          ? []
          : [{ ...ref, cascade, id: nanoid(8), kind: 'dropTable' as const }]),
      ]),
    // Drops exactly the drafts that ran; one edited or queued meanwhile is a
    // new object and stays.
    settle: (applied: DiagramDraft[]) =>
      update((drafts) => drafts.filter((draft) => !applied.includes(draft))),
    remove: (id: string) =>
      update((drafts) => {
        const draft = drafts.find((entry) => entry.id === id)
        if (draft?.kind === 'createTable') {
          return withoutTable(drafts, draft)
        }
        return drafts.filter(
          (entry) =>
            entry.id !== id &&
            !(
              draft?.kind === 'addColumn' &&
              linksTo(entry, draft, draft.column.name)
            )
        )
      }),
    renameColumn: (ref: TableRef, column: string, newName: string) => {
      if (created(ref) || added(ref, column)) {
        editNew(ref, column, (c) => ({ ...c, name: newName }))
        update((drafts) =>
          drafts.map((draft) => {
            if (draft.kind !== 'addForeignKey') {
              return draft
            }
            return {
              ...draft,
              columns: sameTable(draft, ref)
                ? renameIn(draft.columns, column, newName)
                : draft.columns,
              foreignColumns: sameTable(foreignRef(draft), ref)
                ? renameIn(draft.foreignColumns, column, newName)
                : draft.foreignColumns,
            }
          })
        )
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
          drafts.map((draft) => {
            const renamed = sameTable(draft, ref)
              ? { ...draft, table: newName }
              : draft
            return renamed.kind === 'addForeignKey' &&
              sameTable(foreignRef(renamed), ref)
              ? { ...renamed, foreignTable: newName }
              : renamed
          })
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
