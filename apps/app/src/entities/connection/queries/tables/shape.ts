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

interface ColumnTarget extends TableTarget {
  column: string
}

export interface AlterColumnTarget extends ColumnTarget {
  nullable: boolean
  original: ColumnDefinition
  type: string
}

// oxlint-disable-next-line ts/no-explicit-any
type Db = Kysely<any>

const LOW_CARDINALITY = 'LowCardinality('

const clickhouseNeverNullableRegex = /^(?:Array|Map|Tuple)\(/u

// ClickHouse spells nullability as a type wrapper, never as a NULL keyword,
// and it has to sit inside LowCardinality. Array, Map and Tuple reject it.
const clickhouseColumnType = ({
  nullable,
  type: columnType,
}: Pick<NewColumn, 'nullable' | 'type'>) => {
  if (!nullable || clickhouseNeverNullableRegex.test(columnType)) {
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
  let create: CreateTableBuilder<string, string> = db
    .withSchema(schema)
    .schema.createTable(table)

  if (dialectType === ConnectionType.ClickHouse) {
    for (const column of columns) {
      create = create.addColumn(
        column.name,
        sql.raw(clickhouseColumnType(column))
      )
    }
    const order = keys.length
      ? sql`(${identifiers(keys.map((key) => key.name))})`
      : sql`tuple()`

    return create.modifyEnd(sql`ENGINE = MergeTree ORDER BY ${order}`).compile()
  }

  const singleKey = keys.length === 1

  for (const column of columns) {
    create = create.addColumn(
      column.name,
      sql.raw(column.type),
      (definition) => {
        const keyed =
          singleKey && column.primaryKey ? definition.primaryKey() : definition
        return column.nullable ? keyed : keyed.notNull()
      }
    )
  }

  if (keys.length > 1) {
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

// SQL Server refuses to drop or retype a column a DEFAULT constraint depends on
// (Msg 5074), and only the catalog knows that constraint's name.
const mssqlDefaultConstraint = ({ column, schema, table }: ColumnTarget) => {
  const qualified = mssqlQualified(schema, table)

  return {
    drop: sql`DECLARE @default nvarchar(max), @definition nvarchar(max), @statement nvarchar(max);
SELECT @default = QUOTENAME(name), @definition = definition FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(${qualified}) AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(${qualified}), ${column}, 'ColumnId');
SET @statement = N'ALTER TABLE ' + ${qualified} + N' DROP CONSTRAINT ' + @default;
IF @statement IS NOT NULL EXEC sp_executesql @statement;
`,
    restore: sql`;
SET @statement = N'ALTER TABLE ' + ${qualified} + N' ADD CONSTRAINT ' + @default + N' DEFAULT ' + @definition + N' FOR ' + ${mssqlQualified(column)};
IF @statement IS NOT NULL EXEC sp_executesql @statement;`,
  }
}

export const dropColumnStatement = (
  dialectType: ConnectionType,
  db: Db,
  target: ColumnTarget
) => {
  const { column, schema, table } = target

  if (dialectType === ConnectionType.MSSQL) {
    return sql`${mssqlDefaultConstraint(target).drop}ALTER TABLE ${sql.id(schema, table)} DROP COLUMN ${sql.id(column)}`.compile(
      db
    )
  }

  return db
    .withSchema(schema)
    .schema.alterTable(table)
    .dropColumn(column)
    .compile()
}

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
  target: AlterColumnTarget
) => {
  const { column, nullable, original, schema, table, type: columnType } = target
  const retyped = columnType !== original.type
  const alter = db.withSchema(schema).schema.alterTable(table)

  if (dialectType === ConnectionType.ClickHouse) {
    return alter
      .modifyColumn(
        column,
        sql.raw(clickhouseColumnType({ nullable, type: columnType }))
      )
      .compile()
  }

  if (dialectType === ConnectionType.Postgres) {
    const nullability = (builder: AlterColumnBuilder) =>
      nullable ? builder.dropNotNull() : builder.setNotNull()

    if (!retyped) {
      return alter.alterColumn(column, nullability).compile()
    }

    const newType = sql.raw(columnType)
    return alter
      .alterColumn(column, (builder) =>
        builder.setDataType(sql`${newType} USING ${sql.id(column)}::${newType}`)
      )
      .alterColumn(column, nullability)
      .compile()
  }

  const kept = [
    !retyped && original.collation && `COLLATE ${original.collation}`,
    original.attributes,
  ]
    .filter(Boolean)
    .join(' ')
  const definition = sql.raw(kept ? `${columnType} ${kept}` : columnType)

  if (dialectType === ConnectionType.MSSQL) {
    const statement = sql`ALTER TABLE ${sql.id(schema, table)} ALTER COLUMN ${sql.id(column)} ${definition} ${sql.raw(nullable ? 'NULL' : 'NOT NULL')}`
    if (!retyped) {
      return statement.compile(db)
    }
    const { drop, restore } = mssqlDefaultConstraint(target)
    return sql`${drop}${statement}${restore}`.compile(db)
  }

  return alter
    .modifyColumn(column, definition, (builder) =>
      nullable ? builder : builder.notNull()
    )
    .compile()
}
