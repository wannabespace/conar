import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type { ConstraintShape } from '~/core/queries/constraints/shape'
import {
  addConstraint,
  constraintClause,
} from '~/core/queries/constraints/shape'
import type { RenamedValue } from '~/core/queries/shared/inline-enum'
import { mysqlEnum } from '~/core/queries/shared/inline-enum'
import { createQuery } from '~/core/runtime/query'

import type { AlterColumnTarget } from './shape'
import {
  alterColumnStatement,
  renameColumnStatement,
  restatedType,
} from './shape'

interface EditColumnTarget extends AlterColumnTarget {
  newName: string
  reference?: ConstraintShape
  renamedValues: RenamedValue[]
}

const altered = ({ nullable, original, type }: EditColumnTarget) =>
  type !== original.type || nullable !== original.nullable

// Alters under the old name first, so a failing alter leaves the column as it
// was; the key names the new one.
const editInSteps = async (
  dialectType: ConnectionType,
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  target: EditColumnTarget
) => {
  const { column, newName, reference } = target
  if (altered(target)) {
    await db.executeQuery(alterColumnStatement(dialectType, db, target))
  }
  if (newName !== column) {
    await db.executeQuery(renameColumnStatement(dialectType, db, target))
  }
  if (reference) {
    await addConstraint(db, target, reference).execute()
  }
}

// MySQL converts enum rows by label, so a renamed label would truncate them:
// widen the type to hold both labels, then move the rows across.
const mysqlMoveRenamedValues = async (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  target: EditColumnTarget
) => {
  const { column, schema, table } = target
  // The default collation matches labels case-insensitively: a case-only
  // rename converts by itself, and widening would list the label twice.
  const renamed = target.renamedValues.filter(
    ({ from, to }) => from.toLowerCase() !== to.toLowerCase()
  )
  if (renamed.length === 0) {
    return
  }
  const values = new Set([
    ...(mysqlEnum.parse(target.type) ?? []),
    ...renamed.map(({ from }) => from),
  ])
  const widened = mysqlEnum.spell(
    Array.from(values, (value) => ({ value })),
    target.original.type
  )
  await db.executeQuery(
    alterColumnStatement(ConnectionType.MySQL, db, {
      ...target,
      nullable: target.original.nullable,
      type: widened,
    })
  )
  await sql`UPDATE ${sql.id(schema, table)} SET ${sql.id(column)} = CASE ${sql.id(column)} ${sql.join(
    renamed.map(({ from, to }) => sql`WHEN ${from} THEN ${to}`),
    sql` `
  )} END WHERE ${sql.id(column)} IN (${sql.join(renamed.map(({ from }) => from))})`.execute(
    db
  )
}

export const editColumnQuery = (target: EditColumnTarget) =>
  createQuery({
    query: {
      clickhouse: (db) => editInSteps(ConnectionType.ClickHouse, db, target),
      mssql: (db) => editInSteps(ConnectionType.MSSQL, db, target),
      // MySQL commits each DDL statement, so the rename, the alter and the key
      // go in one ALTER: a part that fails leaves the column untouched.
      mysql: async (db) => {
        const { column, newName, nullable, reference, schema, table } = target
        await mysqlMoveRenamedValues(db, target)
        const columnAction = altered(target)
          ? sql`CHANGE COLUMN ${sql.id(column)} ${sql.id(newName)} ${restatedType(target)}${sql.raw(nullable ? '' : ' NOT NULL')}`
          : newName !== column &&
            sql`RENAME COLUMN ${sql.id(column)} TO ${sql.id(newName)}`
        const actions = [
          columnAction,
          reference && sql`ADD ${constraintClause(reference)}`,
        ].filter(Boolean)
        if (actions.length > 0) {
          await sql`ALTER TABLE ${sql.id(schema, table)} ${sql.join(actions)}`.execute(
            db
          )
        }
      },
      postgres: (db) => editInSteps(ConnectionType.Postgres, db, target),
    },
  })
