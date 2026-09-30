import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { AlterColumnBuilder, CreateTableBuilder, Kysely } from 'kysely'
import { sql } from 'kysely'

import { identifiers, mssqlQualified } from '../shared/sql-fragments'

export interface NewColumn {
  name: string
  nullable: boolean
  primaryKey: boolean
  type: string
}

// What the catalog says about a column before an alter; engines that restate
// the whole column (MySQL, SQL Server) repeat the parts the alter leaves alone.
export interface ColumnDefinition {
  attributes: string
  collation: string | null
  nullable: boolean
  type: string
}

interface TableTarget {
  schema: string
  table: string
}

export interface AlterColumnTarget extends TableTarget {
  column: string
  nullable: boolean
  original: ColumnDefinition
  type: string
}

// oxlint-disable-next-line ts/no-explicit-any
type Db = Kysely<any>

const LOW_CARDINALITY = 'LowCardinality('

// ClickHouse spells nullability as a type wrapper, never as a NULL keyword,
// and it has to sit inside LowCardinality.
const clickhouseColumnType = ({
  nullable,
  type: columnType,
}: Pick<NewColumn, 'nullable' | 'type'>) => {
  if (!nullable) {
    return columnType
  }
  return columnType.startsWith(LOW_CARDINALITY)
    ? `${LOW_CARDINALITY}Nullable(${columnType.slice(LOW_CARDINALITY.length, -1)}))`
    : `Nullable(${columnType})`
}

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
          sql`${sql.id(column.name)} ${sql.raw(clickhouseColumnType(column))}`
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
      .addColumn(column.name, sql.raw(clickhouseColumnType(column)))
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
    original,
    schema,
    table,
    type: columnType,
  }: AlterColumnTarget
) => {
  const retyped = columnType !== original.type
  const kept = [
    !retyped && original.collation && `COLLATE ${original.collation}`,
    original.attributes,
  ]
    .filter(Boolean)
    .join(' ')
  const definition = sql.raw(kept ? `${columnType} ${kept}` : columnType)

  if (dialectType === ConnectionType.ClickHouse) {
    return sql`ALTER TABLE ${sql.id(schema, table)} MODIFY COLUMN ${sql.id(column)} ${sql.raw(clickhouseColumnType({ nullable, type: columnType }))}`.compile(
      db
    )
  }

  if (dialectType === ConnectionType.MSSQL) {
    return sql`ALTER TABLE ${sql.id(schema, table)} ALTER COLUMN ${sql.id(column)} ${definition} ${sql.raw(nullable ? 'NULL' : 'NOT NULL')}`.compile(
      db
    )
  }

  const alter = db.withSchema(schema).schema.alterTable(table)

  if (dialectType === ConnectionType.MySQL) {
    return alter
      .modifyColumn(column, definition, (builder) =>
        nullable ? builder : builder.notNull()
      )
      .compile()
  }

  const nullability = (builder: AlterColumnBuilder) =>
    nullable ? builder.dropNotNull() : builder.setNotNull()

  if (!retyped) {
    return alter.alterColumn(column, nullability).compile()
  }

  return alter
    .alterColumn(column, (builder) => builder.setDataType(sql.raw(columnType)))
    .alterColumn(column, nullability)
    .compile()
}
