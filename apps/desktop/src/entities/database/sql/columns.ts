import { type } from 'arktype'
import { sql } from 'kysely'
import { createQuery } from '../query'

export const columnType = type({
  'schema': 'string',
  'table': 'string',
  'id': 'string',
  'default': 'string | null',
  'type': 'string',
  'enum?': 'string',
  'isArray?': 'boolean',
  'editable?': 'boolean',
  'nullable': 'boolean | 1 | 0',
})
  .pipe(({ editable, nullable, ...data }) => ({
    ...data,
    isEditable: Boolean(editable ?? true),
    isNullable: Boolean(nullable),
  }))

function getClickhouseColumnType(type: string): string {
  if (type.startsWith('Enum')) {
    return type.match(/^Enum\d+/)?.[0] || 'Enum'
  }

  if (type.startsWith('Nullable(') && type.endsWith(')')) {
    return type.slice(9, -1)
  }

  return type
}

function getPgColumnType(type: string, udtName: string) {
  if (type === 'ARRAY') {
    return udtName.slice(1)
  }
  else if (type === 'USER-DEFINED') {
    return udtName
  }
  else if (type === 'character varying') {
    return 'varchar'
  }
  else if (type === 'character') {
    return 'char'
  }
  else if (type === 'bit varying') {
    return 'varbit'
  }
  else if (type.startsWith('time')) {
    return udtName || type
  }

  return type
}

export const columnsQuery = createQuery({
  type: columnType.array(),
  query: ({ schema, table }: { schema: string, table: string }) => ({
    postgres: async (db) => {
      const query = await db
        .selectFrom('information_schema.columns')
        .select(eb => [
          'table_schema as schema',
          'table_name as table',
          'column_name as id',
          'column_default as default',
          'data_type',
          'udt_name',
          eb.case('is_nullable')
            .when('YES')
            .then(true)
            .else(false)
            .end()
            .as('nullable'),
          eb.case('is_updatable')
            .when('YES')
            .then(true)
            .else(false)
            .end()
            .as('editable'),
        ])
        .where(({ and, eb }) => and([
          eb('table_schema', '=', schema),
          eb('table_name', '=', table),
        ]))
        .execute()

      return query.map(({ data_type, udt_name, ...row }) => ({
        ...row,
        type: data_type === 'ARRAY' ? `${getPgColumnType(data_type, udt_name)}[]` : getPgColumnType(data_type, udt_name),
        // TODO: handle enum name if data_type is ARRAY
        enum: data_type === 'USER-DEFINED' ? udt_name : undefined,
        isArray: data_type === 'ARRAY',
      } satisfies typeof columnType.inferIn))
    },
    mysql: async (db) => {
      const query = await db
        .selectFrom('information_schema.COLUMNS')
        .select(eb => [
          'TABLE_SCHEMA as schema',
          'TABLE_NAME as table',
          'COLUMN_NAME as id',
          'COLUMN_DEFAULT as default',
          eb.fn.coalesce('DATA_TYPE', 'COLUMN_TYPE').as('type'),
          eb
            .case('IS_NULLABLE')
            .when('YES')
            .then(1)
            .else(0)
            .end()
            .$castTo<1 | 0>()
            .as('nullable'),
        ])
        .where(({ and, eb }) => and([
          eb('TABLE_SCHEMA', '=', schema),
          eb('TABLE_NAME', '=', table),
        ]))
        .execute()

      return query.map(column => ({
        ...column,
        enum: column.type === 'set' || column.type === 'enum' ? column.id : undefined,
        isArray: column.type === 'set',
      } satisfies typeof columnType.inferIn))
    },
    mssql: async (db) => {
      const query = await db
        .selectFrom('information_schema.COLUMNS')
        .select(eb => [
          'TABLE_SCHEMA as schema',
          'TABLE_NAME as table',
          'COLUMN_NAME as name',
          'COLUMN_DEFAULT as default',
          'DATA_TYPE as type',
          eb
            .case('IS_NULLABLE')
            .when('YES')
            .then(1)
            .else(0)
            .end()
            .$castTo<1 | 0>()
            .as('nullable'),
        ])
        .where(({ and, eb }) => and([
          eb('TABLE_SCHEMA', '=', schema),
          eb('TABLE_NAME', '=', table),
        ]))
        .execute()

      return query.map(({ name, ...column }) => ({
        ...column,
        id: name,
        enum: column.type === 'set' || column.type === 'enum' ? name : undefined,
        isArray: column.type === 'set',
      } satisfies typeof columnType.inferIn))
    },
    clickhouse: async (db) => {
      const query = await db
        .selectFrom('information_schema.columns')
        .select(eb => [
          'table_schema as schema',
          'table_name as table',
          'column_name as id',
          'column_default as default',
          'data_type as type',
          eb.case('is_nullable')
            .when(1)
            .then(true)
            .else(false)
            .end()
            .as('nullable'),
          sql<boolean>`true`.as('editable'),
        ])
        .where(({ and, eb }) => and([
          eb('table_schema', '=', schema),
          eb('table_name', '=', table),
        ]))
        .execute()

      return query.map(row => ({
        ...row,
        enum: row.type.includes('Enum') ? row.id : undefined,
        type: getClickhouseColumnType(row.type),
      }))
    },
  }),
})

export const renameColumnQuery = createQuery({
  query: ({ schema, table, oldColumn, newColumn }: { schema: string, table: string, oldColumn: string, newColumn: string }) => ({
    postgres: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .schema
      .alterTable(table)
      .renameColumn(oldColumn, newColumn)
      .execute(),
    mysql: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .schema
      .alterTable(table)
      .renameColumn(oldColumn, newColumn)
      .execute(),
    mssql: async (db) => {
      await sql`EXEC sp_rename ${sql.val(`${schema}.${table}.${oldColumn}`)}, ${sql.val(newColumn)}, 'COLUMN'`.execute(db)
    },
    clickhouse: db => db
      .withSchema(schema)
      .withTables<{ [table]: Record<string, unknown> }>()
      .schema
      .alterTable(table)
      .renameColumn(oldColumn, newColumn)
      .execute(),
  }),
})
