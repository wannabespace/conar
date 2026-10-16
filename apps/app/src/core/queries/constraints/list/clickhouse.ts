import type { Kysely } from 'kysely'

import type { Database as ClickhouseDatabase } from '~/core/runtime/dialects/clickhouse/schema'

import { getClickhouseConstraints } from '../shape'

export const clickhouseConstraints = async (db: Kysely<ClickhouseDatabase>) => {
  const query = await db
    .selectFrom('system.columns')
    .select(['database as schema', 'table', 'name as column'])
    .where('is_in_primary_key', '=', 1)
    .where('database', 'not in', ['system', 'information_schema'])
    .orderBy('database')
    .orderBy('table')
    .orderBy('position')
    .execute()

  const tables = await db
    .selectFrom('system.tables')
    .select(['database', 'name', 'create_table_query'])
    .where('database', 'not in', ['system', 'information_schema'])
    .where('engine', 'not like', '%View')
    .where('create_table_query', 'like', '%CONSTRAINT%')
    .execute()
  const noReference = {
    foreign_column: null,
    foreign_schema: null,
    foreign_table: null,
    onDelete: null,
    onUpdate: null,
  }

  return [
    ...query.map((row) =>
      Object.assign(row, {
        ...noReference,
        name: 'primary_key',
        type: 'PRIMARY KEY' as const,
      })
    ),
    ...tables.flatMap((table) =>
      getClickhouseConstraints(table.create_table_query).map((constraint) => ({
        ...noReference,
        column: null,
        expression: constraint.expression,
        // ASSUME only guides the optimizer; the form writes CHECK.
        is_custom: constraint.assume,
        name: constraint.name,
        schema: table.database,
        table: table.name,
        type: 'CHECK' as const,
      }))
    ),
  ]
}
