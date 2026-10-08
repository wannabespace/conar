import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { CompiledQuery, Kysely } from 'kysely'

import type { ReferentialAction } from '~/core/queries/constraints/shape'
import {
  addConstraint,
  dropConstraintStatement,
} from '~/core/queries/constraints/shape'
import { alterColumnStatement } from '~/core/queries/tables/alter-column-statement'
import type { AlterColumnTarget, NewColumn } from '~/core/queries/tables/shape'
import {
  addColumnStatement,
  createTableStatement,
  dropColumnStatement,
  dropTableStatement,
  renameColumnStatement,
  renameTableStatement,
} from '~/core/queries/tables/shape'

export interface TableRef {
  schema: string
  table: string
}

export type DiagramDraft = { id: string } & TableRef &
  (
    | { columns: NewColumn[]; kind: 'createTable' }
    | { kind: 'renameTable'; newName: string }
    | { cascade: boolean; kind: 'dropTable' }
    | { column: NewColumn; kind: 'addColumn' }
    | { column: string; kind: 'renameColumn'; newName: string }
    | ({ kind: 'alterColumn' } & Omit<AlterColumnTarget, keyof TableRef>)
    | { column: string; kind: 'dropColumn' }
    | {
        columns: string[]
        foreignColumns: string[]
        foreignSchema: string
        foreignTable: string
        kind: 'addForeignKey'
        name: string
        onDelete: ReferentialAction
        onUpdate: ReferentialAction
      }
    | { kind: 'dropForeignKey'; name: string }
  )

// Drafts name tables and columns by their original names, so a rename has to
// run after every statement that still names the object.
const APPLY_ORDER: DiagramDraft['kind'][] = [
  'dropForeignKey',
  'createTable',
  'addColumn',
  'alterColumn',
  'addForeignKey',
  'dropColumn',
  'renameColumn',
  'renameTable',
  'dropTable',
]

export const inApplyOrder = (drafts: DiagramDraft[]) =>
  drafts.toSorted(
    (a, b) => APPLY_ORDER.indexOf(a.kind) - APPLY_ORDER.indexOf(b.kind)
  )

export const isDrop = (draft: DiagramDraft) =>
  draft.kind === 'dropTable' ||
  draft.kind === 'dropColumn' ||
  draft.kind === 'dropForeignKey'

export const draftStatement = (
  dialectType: ConnectionType,
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  draft: DiagramDraft
): CompiledQuery => {
  switch (draft.kind) {
    case 'createTable': {
      return createTableStatement(dialectType, db, draft)
    }
    case 'renameTable': {
      return renameTableStatement(dialectType, db, draft)
    }
    case 'dropTable': {
      return dropTableStatement(dialectType, db, draft)
    }
    case 'addColumn': {
      return addColumnStatement(dialectType, db, draft)
    }
    case 'renameColumn': {
      return renameColumnStatement(dialectType, db, draft)
    }
    case 'alterColumn': {
      return alterColumnStatement(dialectType, db, draft)
    }
    case 'dropColumn': {
      return dropColumnStatement(dialectType, db, draft)
    }
    case 'addForeignKey': {
      return addConstraint(db, draft, {
        ...draft,
        expression: '',
        kind: 'foreignKey',
      }).compile()
    }
    case 'dropForeignKey': {
      return dropConstraintStatement(dialectType, db, {
        ...draft,
        cascade: false,
        kind: 'foreignKey',
      })
    }
    default: {
      return draft satisfies never
    }
  }
}
