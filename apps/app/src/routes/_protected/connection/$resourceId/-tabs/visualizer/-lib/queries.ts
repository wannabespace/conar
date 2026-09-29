import { createConstraintQuery } from '~/entities/connection/queries/constraints/create'
import { dropConstraintQuery } from '~/entities/connection/queries/constraints/drop'
import { addColumnQuery } from '~/entities/connection/queries/tables/add-column'
import { alterColumnQuery } from '~/entities/connection/queries/tables/alter-column'
import { createTableQuery } from '~/entities/connection/queries/tables/create'
import { dropTableQuery } from '~/entities/connection/queries/tables/drop'
import { dropColumnQuery } from '~/entities/connection/queries/tables/drop-column'
import { renameTableQuery } from '~/entities/connection/queries/tables/rename'
import { renameColumnQuery } from '~/entities/connection/queries/tables/rename-columns'

import type { DiagramDraft } from './statements'

export const draftQuery = (draft: DiagramDraft) => {
  switch (draft.kind) {
    case 'createTable': {
      return createTableQuery(draft)
    }
    case 'renameTable': {
      return renameTableQuery({
        newTable: draft.newName,
        oldTable: draft.table,
        schema: draft.schema,
      })
    }
    case 'dropTable': {
      return dropTableQuery(draft)
    }
    case 'addColumn': {
      return addColumnQuery(draft)
    }
    case 'renameColumn': {
      return renameColumnQuery({
        newColumn: draft.newName,
        oldColumn: draft.column,
        schema: draft.schema,
        table: draft.table,
      })
    }
    case 'alterColumn': {
      return alterColumnQuery(draft)
    }
    case 'dropColumn': {
      return dropColumnQuery(draft)
    }
    case 'addForeignKey': {
      return createConstraintQuery({
        schema: draft.schema,
        shape: { ...draft, expression: '', kind: 'foreignKey' },
        table: draft.table,
      })
    }
    case 'dropForeignKey': {
      return dropConstraintQuery({
        cascade: false,
        kind: 'foreignKey',
        name: draft.name,
        schema: draft.schema,
        table: draft.table,
      })
    }
    default: {
      return draft satisfies never
    }
  }
}
