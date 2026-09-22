import type { Kysely, OnModifyForeignAction } from 'kysely'
import { sql } from 'kysely'

import { identifiers } from '../shared/sql-fragments'

export const CONSTRAINT_KINDS = [
  'unique',
  'primaryKey',
  'foreignKey',
  'check',
] as const

export type ConstraintKind = (typeof CONSTRAINT_KINDS)[number]

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
  expression: string
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
    expression,
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
    check: () => alter.addCheckConstraint(name, sql.raw(expression)),
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
  expression,
  foreignColumns,
  foreignSchema,
  foreignTable,
  kind,
  name,
  onDelete,
  onUpdate,
}: ConstraintShape) => {
  if (kind === 'check') {
    return sql`CONSTRAINT ${sql.id(name)} CHECK (${sql.raw(expression)})`
  }

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
    check: sql`CONSTRAINT ${sql.id(name)}`,
    foreignKey: sql`FOREIGN KEY ${sql.id(name)}`,
    primaryKey: sql`PRIMARY KEY`,
    unique: sql`INDEX ${sql.id(name)}`,
  })[kind]

const QUOTES = new Set(["'", '"', '`'])

const tableElementsOf = (ddl: string) => {
  const elements: string[] = []
  let start = ddl.indexOf('(') + 1
  let depth = 0
  let quote = ''

  for (let index = start; index < ddl.length; index += 1) {
    const char = ddl[index]

    if (quote) {
      if (char === '\\') {
        index += 1
      } else if (char === quote) {
        quote = ''
      }
    } else if (char && QUOTES.has(char)) {
      quote = char
    } else if (char === '(') {
      depth += 1
    } else if (char === ')' && depth > 0) {
      depth -= 1
    } else if ((char === ',' && depth === 0) || char === ')') {
      elements.push(ddl.slice(start, index).trim())
      start = index + 1

      if (char === ')') {
        break
      }
    }
  }

  return elements
}

const clickhouseConstraintRegex =
  /^CONSTRAINT\s+(?<name>`(?:[^`\\]|\\.)*`|\S+)\s+(?<kind>CHECK|ASSUME)\s+(?<expression>[\s\S]+)$/u

// ClickHouse keeps no catalog of constraints; they live only in the DDL text.
export const clickhouseConstraintsOf = (ddl: string) =>
  tableElementsOf(ddl).flatMap((element) => {
    const groups = clickhouseConstraintRegex.exec(element)?.groups

    if (!groups?.name || !groups.expression) {
      return []
    }

    return [
      {
        assume: groups.kind === 'ASSUME',
        expression: groups.expression,
        name: groups.name
          .replaceAll(/^`|`$/gu, '')
          .replaceAll(/\\(?<char>.)/gu, '$<char>'),
      },
    ]
  })
