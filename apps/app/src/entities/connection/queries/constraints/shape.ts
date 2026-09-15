import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { RawBuilder } from 'kysely'
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

// SQL Server has no RESTRICT; InnoDB parses SET DEFAULT but rejects the table.
const withheldAction: Partial<Record<ConnectionType, ReferentialAction>> = {
  [ConnectionType.MSSQL]: 'RESTRICT',
  [ConnectionType.MySQL]: 'SET DEFAULT',
}

export const referentialActionsFor = (
  type: ConnectionType
): readonly ReferentialAction[] =>
  REFERENTIAL_ACTIONS.filter((action) => action !== withheldAction[type])

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

const kindKeyword: Record<ConstraintKind, string> = {
  foreignKey: 'FOREIGN KEY',
  primaryKey: 'PRIMARY KEY',
  unique: 'UNIQUE',
}

export const mysqlDropTarget: Record<
  ConstraintKind,
  (name: string) => RawBuilder<unknown>
> = {
  foreignKey: (name) => sql`FOREIGN KEY ${sql.id(name)}`,
  primaryKey: () => sql`PRIMARY KEY`,
  unique: (name) => sql`INDEX ${sql.id(name)}`,
}

export const constraintClause = (shape: ConstraintShape) => {
  const references =
    shape.kind === 'foreignKey'
      ? sql` REFERENCES ${sql.id(shape.foreignSchema, shape.foreignTable)} (${identifiers(shape.foreignColumns)}) ON DELETE ${sql.raw(shape.onDelete)} ON UPDATE ${sql.raw(shape.onUpdate)}`
      : sql``

  return sql`CONSTRAINT ${sql.id(shape.name)} ${sql.raw(kindKeyword[shape.kind])} (${identifiers(shape.columns)})${references}`
}
