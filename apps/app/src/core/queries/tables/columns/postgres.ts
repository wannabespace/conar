import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type { Database as PostgresDatabase } from '~/core/runtime/dialects/postgres/schema'

import type { ColumnsFilter } from '../shape'

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
        .fn<string | null>('col_description', [
          sql`(quote_ident(table_schema) || '.' || quote_ident(table_name))::regclass`,
          'ordinal_position',
        ])
        .as('comment'),
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
    .orderBy('table_schema')
    .orderBy('table_name')
    .orderBy('ordinal_position')
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
          eb
            .fn<string | null>('col_description', ['a.attrelid', 'a.attnum'])
            .as('comment'),
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
        .orderBy('n.nspname')
        .orderBy('c.relname')
        .orderBy('a.attnum')
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
