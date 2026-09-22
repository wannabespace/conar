import type { Kysely, OnModifyForeignAction } from 'kysely'
import { sql } from 'kysely'

import { identifiers } from '../shared/sql-fragments'

export type ConstraintKind = 'foreignKey' | 'primaryKey' | 'unique'

export const REFERENTIAL_ACTIONS = [
  'NO ACTION',
  'RESTRICT',
  'CASCADE',
  'SET NULL',
  'SET DEFAULT',
] as const

export type ReferentialAction = (typeof REFERENTIAL_ACTIONS)[number]

const foreignActions: Record<ReferentialAction, OnModifyForeignAction> = {
  CASCADE: 'cascade',
  'NO ACTION': 'no action',
  RESTRICT: 'restrict',
  'SET DEFAULT': 'set default',
  'SET NULL': 'set null',
}

export interface ConstraintShape {
  columns: string[]
  foreignColumns: string[]
  foreignSchema: string
  foreignTable: string
  kind: ConstraintKind
  name: string
  onDelete: ReferentialAction
  onUpdate: ReferentialAction
}

export interface ConstraintTarget {
  name: string
  schema: string
  table: string
}

export const addConstraint = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  { schema, table }: Omit<ConstraintTarget, 'name'>,
  {
    columns,
    foreignColumns,
    foreignSchema,
    foreignTable,
    kind,
    name,
    onDelete,
    onUpdate,
  }: ConstraintShape
) => {
  const alter = db.withSchema(schema).schema.alterTable(table)

  return {
    foreignKey: () =>
      alter
        .addForeignKeyConstraint(
          name,
          columns,
          `${foreignSchema}.${foreignTable}`,
          foreignColumns
        )
        .onDelete(foreignActions[onDelete])
        .onUpdate(foreignActions[onUpdate]),
    primaryKey: () => alter.addPrimaryKeyConstraint(name, columns),
    unique: () => alter.addUniqueConstraint(name, columns),
  }[kind]()
}

export const dropConstraint = (
  // oxlint-disable-next-line ts/no-explicit-any
  db: Kysely<any>,
  { name, schema, table }: ConstraintTarget
) => db.withSchema(schema).schema.alterTable(table).dropConstraint(name)

// MySQL swaps a key in one ALTER, which no builder spells, so it keeps the
// clause as SQL text.
export const constraintClause = ({
  columns,
  foreignColumns,
  foreignSchema,
  foreignTable,
  kind,
  name,
  onDelete,
  onUpdate,
}: ConstraintShape) => {
  const keyword = {
    foreignKey: sql`FOREIGN KEY`,
    primaryKey: sql`PRIMARY KEY`,
    unique: sql`UNIQUE`,
  }[kind]
  const constraint = sql`CONSTRAINT ${sql.id(name)} ${keyword} (${identifiers(columns)})`

  if (kind !== 'foreignKey') {
    return constraint
  }

  return sql`${constraint} REFERENCES ${sql.id(foreignSchema, foreignTable)} (${identifiers(foreignColumns)}) ON DELETE ${sql.raw(onDelete)} ON UPDATE ${sql.raw(onUpdate)}`
}

// MySQL has no DROP CONSTRAINT for keys; each kind drops through its own clause.
export const mysqlDropKey = (kind: ConstraintKind, name: string) =>
  ({
    foreignKey: sql`FOREIGN KEY ${sql.id(name)}`,
    primaryKey: sql`PRIMARY KEY`,
    unique: sql`INDEX ${sql.id(name)}`,
  })[kind]
