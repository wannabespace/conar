import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type { Database as MysqlDatabase } from '~/core/runtime/dialects/mysql/schema'
import type { Database as PostgresDatabase } from '~/core/runtime/dialects/postgres/schema'

export type ColumnsFilter = { schema: string; table: string } | null

const getPgColumnType = (sqlType: string, udtName: string) => {
  if (sqlType === 'ARRAY') {
    return udtName.slice(1)
  } else if (sqlType === 'USER-DEFINED') {
    return udtName
  } else if (sqlType === 'character varying') {
    return 'varchar'
  } else if (sqlType === 'character') {
    return 'char'
  } else if (sqlType === 'bit varying') {
    return 'varbit'
  } else if (sqlType.startsWith('time')) {
    return udtName || sqlType
  }

  return sqlType
}

export const mysqlColumns = async (
  db: Kysely<MysqlDatabase>,
  filter: ColumnsFilter
) => {
  const query = await db
    .selectFrom('information_schema.COLUMNS')
    .select((eb) => {
      const extraHas = (flag: string) => eb('EXTRA', 'like', `%${flag}%`)
      const isAutoIncrement = extraHas('auto_increment')
      // MariaDB reports COLUMN_DEFAULT as SQL (quoted literals, NULL for no
      // default); MySQL reports the bare value, and marks expressions only
      // from 8.0.13 on.
      const defaultValue = eb
        .case()
        .when(
          eb.or([
            eb(eb.fn('version'), 'like', '%MariaDB%'),
            eb('DATA_TYPE', '=', 'bit'),
            eb.and([
              eb('DATA_TYPE', 'in', ['datetime', 'timestamp']),
              eb('COLUMN_DEFAULT', 'like', 'CURRENT_TIMESTAMP%'),
            ]),
          ])
        )
        .then(
          eb.fn<string | null>('nullif', ['COLUMN_DEFAULT', eb.val('NULL')])
        )
        .when(extraHas('DEFAULT_GENERATED'))
        .then(eb.fn('concat', [eb.val('('), 'COLUMN_DEFAULT', eb.val(')')]))
        .when('COLUMN_DEFAULT', 'is not', null)
        .then(eb.fn('quote', ['COLUMN_DEFAULT']))
        .end()

      return [
        'TABLE_SCHEMA as schema',
        'TABLE_NAME as table',
        'COLUMN_NAME as id',
        'COLUMN_DEFAULT as default',
        'CHARACTER_MAXIMUM_LENGTH as max_length',
        'NUMERIC_PRECISION as precision',
        'NUMERIC_SCALE as scale',
        'DATA_TYPE as type',
        'COLUMN_TYPE as declaredType',
        'COLLATION_NAME as collation',
        eb
          .fn<string>('concat_ws', [
            eb.val(' '),
            eb.fn('concat', [eb.val('DEFAULT '), defaultValue]),
            eb.case().when(isAutoIncrement).then('AUTO_INCREMENT').end(),
            eb
              .case()
              .when(extraHas('on update'))
              .then(
                sql<string>`REPLACE(SUBSTRING(EXTRA, LOCATE('on update', EXTRA)), ' INVISIBLE', '')`
              )
              .end(),
            eb.case().when(extraHas('INVISIBLE')).then('INVISIBLE').end(),
            eb
              .case()
              .when('COLUMN_COMMENT', '!=', '')
              .then(
                eb.fn('concat', [
                  eb.val('COMMENT '),
                  eb.fn('quote', ['COLUMN_COMMENT']),
                ])
              )
              .end(),
          ])
          .as('attributes'),
        eb
          .and([
            eb.not(extraHas('VIRTUAL GENERATED')),
            eb.not(extraHas('STORED GENERATED')),
          ])
          .as('editable'),
        isAutoIncrement.as('isIdentity'),
        eb
          .or([
            isAutoIncrement,
            extraHas('VIRTUAL GENERATED'),
            extraHas('STORED GENERATED'),
          ])
          .as('isGenerated'),
        eb('IS_NULLABLE', '=', 'YES').as('nullable'),
      ]
    })
    .$call((qb) =>
      filter
        ? qb.where(({ and, eb }) =>
            and([
              eb('TABLE_SCHEMA', '=', filter.schema),
              eb('TABLE_NAME', '=', filter.table),
            ])
          )
        : qb.where('TABLE_SCHEMA', 'not in', [
            'mysql',
            'information_schema',
            'performance_schema',
            'sys',
          ])
    )
    .orderBy(['TABLE_SCHEMA', 'TABLE_NAME', 'ORDINAL_POSITION'])
    .execute()

  return query.map((column) => ({
    ...column,
    enumName:
      column.type === 'set' || column.type === 'enum' ? column.id : undefined,
    isArray: column.type === 'set',
    maxLength: column.max_length,
  }))
}

export const postgresColumns = async (
  db: Kysely<PostgresDatabase>,
  filter: ColumnsFilter
) => {
  const query = await db
    .selectFrom('information_schema.columns')
    .select((eb) => [
      'table_schema as schema',
      'table_name as table',
      'column_name as id',
      'column_default as default',
      'data_type',
      'udt_name',
      'character_maximum_length as max_length',
      'numeric_precision as precision',
      'numeric_scale as scale',
      eb
        .selectFrom('pg_catalog.pg_attribute as a')
        .select((sub) =>
          sub
            .fn<string>('format_type', [
              sub.ref('a.atttypid'),
              sub.ref('a.atttypmod'),
            ])
            .as('declaredType')
        )
        .where(
          'a.attrelid',
          '=',
          sql<number>`(quote_ident(table_schema) || '.' || quote_ident(table_name))::regclass`
        )
        .whereRef('a.attname', '=', 'column_name')
        .as('declaredType'),
      sql<boolean>`is_identity = 'YES' OR is_generated = 'ALWAYS'`.as(
        'isGenerated'
      ),
      sql<boolean>`is_nullable = 'YES'`.as('nullable'),
      sql<boolean>`is_updatable = 'YES' AND is_generated <> 'ALWAYS' AND identity_generation IS DISTINCT FROM 'ALWAYS'`.as(
        'editable'
      ),
      sql<boolean>`is_identity = 'YES'`.as('isIdentity'),
    ])
    .$call((qb) =>
      filter
        ? qb.where(({ and, eb }) =>
            and([
              eb('table_schema', '=', filter.schema),
              eb('table_name', '=', filter.table),
            ])
          )
        : qb
            .where('table_schema', 'not like', 'pg_%')
            .where('table_schema', '!=', 'information_schema')
    )
    .orderBy(['table_schema', 'table_name', 'ordinal_position'])
    .execute()

  // information_schema.columns skips materialized views; pg_attribute
  // fills them in.
  let relkinds: string[] | null = null
  if (filter === null) {
    relkinds = ['m']
  } else if (query.length === 0) {
    relkinds = ['r', 'p', 'v', 'm']
  }
  const fallback = relkinds
    ? await db
        .selectFrom('pg_catalog.pg_attribute as a')
        .innerJoin('pg_catalog.pg_class as c', 'c.oid', 'a.attrelid')
        .innerJoin('pg_catalog.pg_namespace as n', 'n.oid', 'c.relnamespace')
        .leftJoin('pg_catalog.pg_attrdef as ad', (join) =>
          join
            .onRef('ad.adrelid', '=', 'a.attrelid')
            .onRef('ad.adnum', '=', 'a.attnum')
        )
        .select((eb) => [
          'n.nspname as schema',
          'c.relname as table',
          'a.attname as id',
          eb
            .fn<string | null>('pg_get_expr', [
              eb.ref('ad.adbin'),
              eb.ref('ad.adrelid'),
            ])
            .as('default'),
          eb
            .fn<string>('format_type', [
              eb.ref('a.atttypid'),
              eb.ref('a.atttypmod'),
            ])
            .as('type'),
          sql<boolean>`not a.attnotnull`.as('nullable'),
        ])
        .where(({ and, eb }) =>
          and([
            eb('a.attnum', '>', 0),
            eb('a.attisdropped', '=', false),
            eb('c.relkind', 'in', relkinds),
          ])
        )
        .$call((qb) =>
          filter
            ? qb.where(({ and, eb }) =>
                and([
                  eb('n.nspname', '=', filter.schema),
                  eb('c.relname', '=', filter.table),
                ])
              )
            : qb
                .where('n.nspname', 'not like', 'pg_%')
                .where('n.nspname', '!=', 'information_schema')
        )
        .orderBy(['n.nspname', 'c.relname', 'a.attnum'])
        .execute()
    : []
  const fallbackColumns = fallback.map((row) => ({
    ...row,
    declaredType: row.type,
    editable: false,
    isArray: row.type.endsWith('[]'),
    type: row.type.endsWith('[]') ? row.type.slice(0, -2) : row.type,
  }))

  const columns = query.map(({ data_type, udt_name, ...row }) => {
    let enumName: string | undefined
    if (data_type === 'USER-DEFINED') {
      enumName = udt_name
    } else if (data_type === 'ARRAY') {
      enumName = udt_name.slice(1)
    }

    return {
      ...row,
      enumName,
      isArray: data_type === 'ARRAY',
      maxLength: row.max_length,
      type: data_type === 'ARRAY' ? `${udt_name.slice(1)}[]` : data_type,
      typeLabel:
        data_type === 'ARRAY'
          ? `${getPgColumnType(data_type, udt_name)}[]`
          : getPgColumnType(data_type, udt_name),
    }
  })

  return [...columns, ...fallbackColumns]
}
