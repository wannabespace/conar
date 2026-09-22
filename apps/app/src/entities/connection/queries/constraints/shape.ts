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
