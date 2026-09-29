import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'
import type { CreateTableBuilder, Kysely } from 'kysely'
import { sql } from 'kysely'

import { identifiers, mssqlQualified } from '../shared/sql-fragments'

export const newColumnType = type({
  name: 'string',
  nullable: 'boolean',
  primaryKey: 'boolean',
  type: 'string',
})

export type NewColumn = typeof newColumnType.infer

interface TableTarget {
  schema: string
  table: string
}

// oxlint-disable-next-line ts/no-explicit-any
type Db = Kysely<any>

// ClickHouse spells nullability as a type wrapper, never as a NULL keyword.
const clickhouseColumnType = (columnType: string, nullable: boolean) =>
  nullable ? `Nullable(${columnType})` : columnType

export const createTableStatement = (
  dialectType: ConnectionType,
  db: Db,
  { columns, schema, table }: TableTarget & { columns: NewColumn[] }
) => {
  const keys = columns.filter((column) => column.primaryKey)

  if (dialectType === ConnectionType.ClickHouse) {
    const definitions = sql.join(
      columns.map(
        (column) =>
          sql`${sql.id(column.name)} ${sql.raw(clickhouseColumnType(column.type, column.nullable))}`
      )
    )
    const order = keys.length
      ? sql`(${identifiers(keys.map((key) => key.name))})`
      : sql`tuple()`

    return sql`CREATE TABLE ${sql.id(schema, table)} (${definitions}) ENGINE = MergeTree ORDER BY ${order}`.compile(
      db
    )
  }

  let create: CreateTableBuilder<string, string> = db
    .withSchema(schema)
    .schema.createTable(table)

  for (const column of columns) {
    create = create.addColumn(
      column.name,
      sql.raw(column.type),
      (definition) => (column.nullable ? definition : definition.notNull())
    )
  }

  if (keys.length) {
    create = create.addPrimaryKeyConstraint(
      `${table}_pkey`,
      keys.map((key) => key.name)
    )
  }

  return create.compile()
}

export const renameTableStatement = (
  dialectType: ConnectionType,
  db: Db,
  { newName, schema, table }: TableTarget & { newName: string }
) => {
  if (dialectType === ConnectionType.ClickHouse) {
    return sql`RENAME TABLE ${sql.id(schema, table)} TO ${sql.id(schema, newName)}`.compile(
      db
    )
  }

  if (dialectType === ConnectionType.MSSQL) {
    return sql`EXEC sp_rename ${sql.val(mssqlQualified(schema, table))}, ${sql.val(newName)}`.compile(
      db
    )
  }

  return db
    .withSchema(schema)
    .schema.alterTable(table)
    .renameTo(newName)
    .compile()
}

export const dropTableStatement = (
  dialectType: ConnectionType,
  db: Db,
  { cascade, schema, table }: TableTarget & { cascade: boolean }
) => {
  const drop = db.withSchema(schema).schema.dropTable(table)

  return (
    cascade && dialectType === ConnectionType.Postgres ? drop.cascade() : drop
  ).compile()
}

export const addColumnStatement = (
  dialectType: ConnectionType,
  db: Db,
  { column, schema, table }: TableTarget & { column: NewColumn }
) => {
  const alter = db.withSchema(schema).schema.alterTable(table)

  if (dialectType === ConnectionType.ClickHouse) {
    return alter
      .addColumn(
        column.name,
        sql.raw(clickhouseColumnType(column.type, column.nullable))
      )
      .compile()
  }

  return alter
    .addColumn(column.name, sql.raw(column.type), (definition) =>
      column.nullable ? definition : definition.notNull()
    )
    .compile()
}

export const dropColumnStatement = (
  db: Db,
  { column, schema, table }: TableTarget & { column: string }
) => db.withSchema(schema).schema.alterTable(table).dropColumn(column).compile()

export const renameColumnStatement = (
  dialectType: ConnectionType,
  db: Db,
  {
    column,
    newName,
    schema,
    table,
  }: TableTarget & {
    column: string
    newName: string
  }
) => {
  if (dialectType === ConnectionType.MSSQL) {
    return sql`EXEC sp_rename ${sql.val(mssqlQualified(schema, table, column))}, ${sql.val(newName)}, 'COLUMN'`.compile(
      db
    )
  }

  return db
    .withSchema(schema)
    .schema.alterTable(table)
    .renameColumn(column, newName)
    .compile()
}

export const alterColumnStatement = (
  dialectType: ConnectionType,
  db: Db,
  {
    column,
    nullable,
    schema,
    table,
    type: columnType,
  }: TableTarget & { column: string; nullable: boolean; type: string }
) => {
  if (dialectType === ConnectionType.ClickHouse) {
    return sql`ALTER TABLE ${sql.id(schema, table)} MODIFY COLUMN ${sql.id(column)} ${sql.raw(clickhouseColumnType(columnType, nullable))}`.compile(
      db
    )
  }

  if (dialectType === ConnectionType.MSSQL) {
    return sql`ALTER TABLE ${sql.id(schema, table)} ALTER COLUMN ${sql.id(column)} ${sql.raw(columnType)} ${sql.raw(nullable ? 'NULL' : 'NOT NULL')}`.compile(
      db
    )
  }

  const alter = db.withSchema(schema).schema.alterTable(table)

  if (dialectType === ConnectionType.MySQL) {
    return alter
      .modifyColumn(column, sql.raw(columnType), (definition) =>
        nullable ? definition : definition.notNull()
      )
      .compile()
  }

  return alter
    .alterColumn(column, (definition) =>
      definition.setDataType(sql.raw(columnType))
    )
    .alterColumn(column, (definition) =>
      nullable ? definition.dropNotNull() : definition.setNotNull()
    )
    .compile()
}
