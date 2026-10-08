import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type { Database as MssqlDatabase } from '~/core/runtime/dialects/mssql/schema'

import type { ColumnsFilter } from './shape'

export const mssqlColumns = async (
  db: Kysely<MssqlDatabase>,
  filter: ColumnsFilter
) => {
  const tableId = sql<number>`OBJECT_ID(QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME))`
  const query = await db
    .selectFrom('information_schema.COLUMNS')
    .leftJoin('sys.extended_properties as ep', (join) =>
      join
        .on('ep.major_id', '=', tableId)
        .on(
          'ep.minor_id',
          '=',
          sql<number>`COLUMNPROPERTY(${tableId}, COLUMN_NAME, 'ColumnId')`
        )
        .on('ep.class', '=', 1)
        .on('ep.name', '=', 'MS_Description')
    )
    .select((eb) => [
      'TABLE_SCHEMA as schema',
      'TABLE_NAME as table',
      'COLUMN_NAME as name',
      'COLUMN_DEFAULT as default',
      'CHARACTER_MAXIMUM_LENGTH as max_length',
      'NUMERIC_PRECISION as precision',
      'NUMERIC_SCALE as scale',
      'DATA_TYPE as type',
      'COLLATION_NAME as collation',
      sql<string | null>`NULLIF(CAST(ep.value AS nvarchar(max)), '')`.as(
        'comment'
      ),
      eb
        .case()
        .when('DATA_TYPE', 'in', [
          'binary',
          'char',
          'nchar',
          'nvarchar',
          'varbinary',
          'varchar',
        ])
        .then(
          sql<string>`DATA_TYPE + '(' + IIF(CHARACTER_MAXIMUM_LENGTH = -1, 'max', CAST(CHARACTER_MAXIMUM_LENGTH AS varchar(10))) + ')'`
        )
        .when('DATA_TYPE', 'in', ['decimal', 'numeric'])
        .then(
          sql<string>`DATA_TYPE + '(' + CAST(NUMERIC_PRECISION AS varchar(10)) + ', ' + CAST(NUMERIC_SCALE AS varchar(10)) + ')'`
        )
        .when('DATA_TYPE', 'in', ['datetime2', 'datetimeoffset', 'time'])
        .then(
          sql<string>`DATA_TYPE + '(' + CAST(DATETIME_PRECISION AS varchar(10)) + ')'`
        )
        .else(eb.ref('DATA_TYPE'))
        .end()
        .as('declaredType'),
      sql<number | null>`
        CASE WHEN DATA_TYPE IN ('timestamp', 'rowversion')
          OR COLUMNPROPERTY(OBJECT_ID(QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME)), COLUMN_NAME, 'IsIdentity') = 1
          OR COLUMNPROPERTY(OBJECT_ID(QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME)), COLUMN_NAME, 'IsComputed') = 1
        THEN 1 ELSE 0 END
      `.as('isGenerated'),
      sql<number | null>`
        COLUMNPROPERTY(
          OBJECT_ID(QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME)),
          COLUMN_NAME,
          'IsIdentity'
        )
      `.as('isIdentity'),
      sql<1 | 0>`IIF(IS_NULLABLE = 'YES', 1, 0)`.as('nullable'),
    ])
    .$call((qb) =>
      filter
        ? qb.where(({ and, eb }) =>
            and([
              eb('TABLE_SCHEMA', '=', filter.schema),
              eb('TABLE_NAME', '=', filter.table),
            ])
          )
        : qb.where('TABLE_SCHEMA', 'not in', ['sys', 'INFORMATION_SCHEMA'])
    )
    .orderBy('TABLE_SCHEMA')
    .orderBy('TABLE_NAME')
    .orderBy('ORDINAL_POSITION')
    .execute()

  return query.map(({ name, ...column }) => ({
    ...column,
    // Identity, computed and rowversion columns all refuse an UPDATE.
    editable: !column.isGenerated,
    id: name,
    maxLength: column.max_length,
  }))
}
