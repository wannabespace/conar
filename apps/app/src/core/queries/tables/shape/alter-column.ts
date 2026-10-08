import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { AlterColumnBuilder } from 'kysely'
import { sql } from 'kysely'

import type { AlterColumnTarget, Db } from './shape'
import { clickhouseColumnType, mssqlDefaultConstraint } from './shape'

const restatedType = ({
  original,
  type: columnType,
}: Pick<AlterColumnTarget, 'original' | 'type'>) => {
  const kept = [
    columnType === original.type &&
      original.collation &&
      `COLLATE ${original.collation}`,
    original.attributes,
  ]
    .filter(Boolean)
    .join(' ')
  return sql.raw(kept ? `${columnType} ${kept}` : columnType)
}

// MySQL drops the comment on a MODIFY or CHANGE COLUMN that does not restate it.
export const mysqlColumnDefinition = (
  target: Pick<AlterColumnTarget, 'original' | 'type'>,
  comment = target.original.comment
) =>
  sql`${restatedType(target)}${comment ? sql` COMMENT ${sql.lit(comment)}` : sql``}`

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

  if (dialectType === ConnectionType.MSSQL) {
    const statement = sql`ALTER TABLE ${sql.id(schema, table)} ALTER COLUMN ${sql.id(column)} ${restatedType(target)} ${sql.raw(nullable ? 'NULL' : 'NOT NULL')}`
    if (!retyped) {
      return statement.compile(db)
    }
    const { drop, restore } = mssqlDefaultConstraint(target)
    return sql`${drop}${statement}${restore}`.compile(db)
  }

  return alter
    .modifyColumn(column, mysqlColumnDefinition(target), (builder) =>
      nullable ? builder : builder.notNull()
    )
    .compile()
}
