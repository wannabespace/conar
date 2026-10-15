import { tryCatchAsync } from '@tamery/shared/utils'
import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type { Database as MysqlDatabase } from '~/core/runtime/dialects/mysql/schema'

import type { ColumnsFilter } from '../shape'

const SYSTEM_SCHEMAS = [
  'mysql',
  'information_schema',
  'performance_schema',
  'sys',
]

export const mysqlColumns = async (
  db: Kysely<MysqlDatabase>,
  filter: ColumnsFilter
) => {
  const query = await db
    .selectFrom('information_schema.COLUMNS')
    .select((eb) => {
      const extraHas = (flag: string) => eb('EXTRA', 'like', `%${flag}%`)
      const isAutoIncrement = extraHas('auto_increment')
      const isMariadb = eb(eb.fn('version'), 'like', '%MariaDB%')
      // MariaDB reports COLUMN_DEFAULT as SQL (quoted literals, NULL for no
      // default); MySQL reports the bare value, and marks expressions only
      // from 8.0.13 on.
      const defaultValue = eb
        .case()
        .when(
          eb.or([
            isMariadb,
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
          ])
          .as('attributes'),
        eb
          .fn<string | null>('nullif', ['COLUMN_COMMENT', eb.val('')])
          .as('comment'),
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
        isMariadb.as('mariadb'),
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
        : qb.where('TABLE_SCHEMA', 'not in', SYSTEM_SCHEMAS)
    )
    .orderBy('TABLE_SCHEMA')
    .orderBy('TABLE_NAME')
    .orderBy('ORDINAL_POSITION')
    .execute()

  // MariaDB's JSON is a LONGTEXT under a json_valid() check. MySQL's CHECK_CONSTRAINTS has no TABLE_NAME, and neither MySQL 5.7 nor MariaDB before 10.2.22/10.3.10 has the table, so a failed read means no checks.
  const { data: checks } = await tryCatchAsync(async () =>
    query.some((column) => column.mariadb && column.type === 'longtext')
      ? await db
          .selectFrom('information_schema.CHECK_CONSTRAINTS')
          .select([
            'CONSTRAINT_SCHEMA as schema',
            'TABLE_NAME as table',
            'CHECK_CLAUSE as clause',
          ])
          .where('CHECK_CLAUSE', 'like', 'json_valid(%')
          .$call((qb) =>
            filter
              ? qb
                  .where('CONSTRAINT_SCHEMA', '=', filter.schema)
                  .where('TABLE_NAME', '=', filter.table)
              : qb.where('CONSTRAINT_SCHEMA', 'not in', SYSTEM_SCHEMAS)
          )
          .execute()
      : []
  )
  const jsonColumns = new Set(
    (checks ?? []).map(
      ({ clause, schema, table }) => `${schema}.${table}.${clause}`
    )
  )

  return query.map(({ mariadb: _mariadb, ...column }) => ({
    ...column,
    ...(jsonColumns.has(
      `${column.schema}.${column.table}.json_valid(\`${column.id}\`)`
    ) && { declaredType: 'json', type: 'json' }),
    enumName:
      column.type === 'set' || column.type === 'enum' ? column.id : undefined,
    isArray: column.type === 'set',
    maxLength: column.max_length,
  }))
}
