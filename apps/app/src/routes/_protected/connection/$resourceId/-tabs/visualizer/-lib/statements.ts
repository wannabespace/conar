import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { unsupported } from '@tamery/shared/unsupported'
import { type } from 'arktype'
import type { CompiledQuery, Kysely } from 'kysely'
import { sql } from 'kysely'

import {
  REFERENTIAL_ACTIONS,
  addConstraint,
  dropConstraint,
  mysqlDropKey,
} from '~/entities/connection/queries/constraints/shape'
import {
  addColumnStatement,
  alterColumnStatement,
  createTableStatement,
  dropColumnStatement,
  dropTableStatement,
  newColumnType,
  renameColumnStatement,
  renameTableStatement,
} from '~/entities/connection/queries/tables/shape'

const referentialActionType = type.enumerated(...REFERENTIAL_ACTIONS)

export const diagramDraftType = type({ id: 'string' }).and(
  type.or(
    type({
      columns: newColumnType.array(),
      kind: '"createTable"',
      schema: 'string',
      table: 'string',
    }),
    type({
      kind: '"renameTable"',
      newName: 'string',
      schema: 'string',
      table: 'string',
    }),
    type({
      cascade: 'boolean',
      kind: '"dropTable"',
      schema: 'string',
      table: 'string',
    }),
    type({
      column: newColumnType,
      kind: '"addColumn"',
      schema: 'string',
      table: 'string',
    }),
    type({
      column: 'string',
      kind: '"renameColumn"',
      newName: 'string',
      schema: 'string',
      table: 'string',
    }),
    type({
      column: 'string',
      kind: '"alterColumn"',
      nullable: 'boolean',
      schema: 'string',
      table: 'string',
      type: 'string',
    }),
    type({
      column: 'string',
      kind: '"dropColumn"',
      schema: 'string',
      table: 'string',
    }),
    type({
      columns: 'string[]',
      foreignColumns: 'string[]',
      foreignSchema: 'string',
      foreignTable: 'string',
      kind: '"addForeignKey"',
      name: 'string',
      onDelete: referentialActionType,
      onUpdate: referentialActionType,
      schema: 'string',
      table: 'string',
    }),
    type({
      kind: '"dropForeignKey"',
      name: 'string',
      schema: 'string',
      table: 'string',
    })
  )
)

export type DiagramDraft = typeof diagramDraftType.infer

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
      return dropColumnStatement(db, draft)
    }
    case 'addForeignKey': {
      if (dialectType === ConnectionType.ClickHouse) {
        unsupported('Foreign keys')()
      }

      return addConstraint(db, draft, {
        ...draft,
        expression: '',
        kind: 'foreignKey',
      }).compile()
    }
    case 'dropForeignKey': {
      if (dialectType === ConnectionType.ClickHouse) {
        unsupported('Foreign keys')()
      }

      return dialectType === ConnectionType.MySQL
        ? sql`ALTER TABLE ${sql.id(draft.schema, draft.table)} DROP ${mysqlDropKey('foreignKey', draft.name)}`.compile(
            db
          )
        : dropConstraint(db, draft).compile()
    }
    default: {
      return draft satisfies never
    }
  }
}
