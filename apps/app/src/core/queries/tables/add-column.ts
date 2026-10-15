import { SqlDialect } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import type { ConstraintShape } from '~/core/queries/constraints/shape'
import {
  addConstraint,
  constraintClause,
} from '~/core/queries/constraints/shape'
import { createQuery } from '~/core/runtime/query'

import type { NewColumn } from './shape'
import { addColumnStatement } from './shape'

export const addColumnQuery = ({
  reference,
  ...target
}: {
  column: NewColumn
  reference?: ConstraintShape
  schema: string
  table: string
}) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        db.executeQuery(addColumnStatement(SqlDialect.ClickHouse, db, target)),
      mssql: async (db) => {
        await db.executeQuery(addColumnStatement(SqlDialect.MSSQL, db, target))
        if (reference) {
          await addConstraint(db, target, reference).execute()
        }
      },
      // MySQL commits each DDL statement, so the key goes in the same ALTER:
      // a key that fails leaves no column behind.
      mysql: (db) => {
        const { column, schema, table } = target
        return reference
          ? sql`ALTER TABLE ${sql.id(schema, table)} ADD COLUMN ${sql.id(column.name)} ${sql.raw(column.type)}${sql.raw(column.nullable ? '' : ' NOT NULL')}, ADD ${constraintClause(reference)}`.execute(
              db
            )
          : db.executeQuery(addColumnStatement(SqlDialect.MySQL, db, target))
      },
      postgres: async (db) => {
        await db.executeQuery(
          addColumnStatement(SqlDialect.Postgres, db, target)
        )
        if (reference) {
          await addConstraint(db, target, reference).execute()
        }
      },
    },
  })
