import type { connectionsResources } from '~/drizzle/schema'
import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'
import { connectionResourceToQueryParams, createQuery } from '../query'

const constraintType = type('"PRIMARY KEY" | "UNIQUE" | "FOREIGN KEY" | "CHECK" | "EXCLUSION"')

const neededConstraintTypes = ['PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY'] as const satisfies typeof constraintType.infer[]

const constraintTypeLabelMap = {
  'PRIMARY KEY': 'primaryKey',
  'UNIQUE': 'unique',
  'FOREIGN KEY': 'foreignKey',
  'CHECK': 'check',
  'EXCLUSION': 'exclusion',
} as const satisfies Record<typeof constraintType.infer, string>

export const constraintsType = type({
  schema: 'string',
  table: 'string',
  foreign_schema: 'string | null',
  foreign_table: 'string | null',
  foreign_column: 'string | null',
  name: 'string',
  type: constraintType,
  column: 'string | null',
  onDelete: 'string | null',
  onUpdate: 'string | null',
})
  .pipe(({ type, foreign_column, foreign_table, foreign_schema, ...item }) => ({
    ...item,
    type: constraintTypeLabelMap[type as typeof neededConstraintTypes[number]],
    foreignTable: foreign_table,
    foreignColumn: foreign_column,
    foreignSchema: foreign_schema,
  }))

export const resourceConstraintsQuery = createQuery({
  type: constraintsType.array(),
  query: {
    postgres: db => db
      .selectFrom('pg_catalog.pg_constraint as con')
      .innerJoin('pg_catalog.pg_class as c', 'con.conrelid', 'c.oid')
      .innerJoin('pg_catalog.pg_namespace as n', 'c.relnamespace', 'n.oid')
      .innerJoin('pg_catalog.pg_attribute as a', join => join
        .onRef('a.attrelid', '=', 'con.conrelid')
        .on(sql<boolean>`a.attnum = ANY(con.conkey)`))
      .leftJoin('pg_catalog.pg_class as fc', 'con.confrelid', 'fc.oid')
      .leftJoin('pg_catalog.pg_namespace as fn', join => join
        .onRef('fn.oid', '=', 'fc.relnamespace'))
      .leftJoin('pg_catalog.pg_attribute as fa', join => join
        .onRef('fa.attrelid', '=', 'con.confrelid')
        .on(sql<boolean>`fa.attnum = (con.confkey)[array_position(con.conkey, a.attnum)]`))
      .select([
        'n.nspname as schema',
        'c.relname as table',
        'con.conname as name',
        sql<typeof constraintType.infer>`CASE con.contype WHEN 'p' THEN 'PRIMARY KEY' WHEN 'u' THEN 'UNIQUE' WHEN 'f' THEN 'FOREIGN KEY' END`.as('type'),
        sql<string | null>`a.attname`.as('column'),
        'fn.nspname as foreign_schema',
        'fc.relname as foreign_table',
        'fa.attname as foreign_column',
        sql<string | null>`CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END`.as('onDelete'),
        sql<string | null>`CASE con.confupdtype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END`.as('onUpdate'),
      ])
      .where('con.contype', 'in', ['p', 'u', 'f'])
      .where('n.nspname', 'not like', 'pg_%')
      .where('n.nspname', '!=', 'information_schema')
      .execute(),
    mysql: db => db
      .selectFrom('information_schema.TABLE_CONSTRAINTS as tc')
      .leftJoin('information_schema.KEY_COLUMN_USAGE as kcu', join => join
        .onRef('tc.CONSTRAINT_NAME', '=', 'kcu.CONSTRAINT_NAME')
        .onRef('tc.CONSTRAINT_SCHEMA', '=', 'kcu.CONSTRAINT_SCHEMA')
        .onRef('tc.TABLE_SCHEMA', '=', 'kcu.TABLE_SCHEMA')
        .onRef('tc.TABLE_NAME', '=', 'kcu.TABLE_NAME'))
      .leftJoin('information_schema.REFERENTIAL_CONSTRAINTS as rc', join => join
        .onRef('tc.CONSTRAINT_NAME', '=', 'rc.CONSTRAINT_NAME')
        .onRef('tc.CONSTRAINT_SCHEMA', '=', 'rc.CONSTRAINT_SCHEMA')
        .onRef('tc.TABLE_NAME', '=', 'rc.TABLE_NAME'))
      .select([
        'tc.TABLE_SCHEMA as schema',
        'tc.TABLE_NAME as table',
        'tc.CONSTRAINT_NAME as name',
        'tc.CONSTRAINT_TYPE as type',
        'kcu.COLUMN_NAME as column',
        'kcu.REFERENCED_TABLE_SCHEMA as foreign_schema',
        'kcu.REFERENCED_TABLE_NAME as foreign_table',
        'kcu.REFERENCED_COLUMN_NAME as foreign_column',
        'rc.DELETE_RULE as onDelete',
        'rc.UPDATE_RULE as onUpdate',
      ])
      .where('tc.CONSTRAINT_TYPE', 'in', neededConstraintTypes)
      .where('tc.TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])
      .execute(),
    mssql: db => db
      .selectFrom('information_schema.TABLE_CONSTRAINTS as tc')
      .leftJoin('information_schema.KEY_COLUMN_USAGE as kcu', join => join
        .onRef('tc.CONSTRAINT_NAME', '=', 'kcu.CONSTRAINT_NAME')
        .onRef('tc.CONSTRAINT_SCHEMA', '=', 'kcu.CONSTRAINT_SCHEMA')
        .onRef('tc.TABLE_SCHEMA', '=', 'kcu.TABLE_SCHEMA')
        .onRef('tc.TABLE_NAME', '=', 'kcu.TABLE_NAME'))
      .leftJoin('information_schema.REFERENTIAL_CONSTRAINTS as rc', join => join
        .onRef('tc.CONSTRAINT_NAME', '=', 'rc.CONSTRAINT_NAME')
        .onRef('tc.CONSTRAINT_SCHEMA', '=', 'rc.CONSTRAINT_SCHEMA'))
      .leftJoin('information_schema.KEY_COLUMN_USAGE as referenced_kcu', join => join
        .onRef('rc.UNIQUE_CONSTRAINT_NAME', '=', 'referenced_kcu.CONSTRAINT_NAME')
        .onRef('rc.UNIQUE_CONSTRAINT_SCHEMA', '=', 'referenced_kcu.CONSTRAINT_SCHEMA')
        .onRef('kcu.ORDINAL_POSITION', '=', 'referenced_kcu.ORDINAL_POSITION'))
      .select([
        'tc.TABLE_SCHEMA as schema',
        'tc.TABLE_NAME as table',
        'tc.CONSTRAINT_NAME as name',
        'tc.CONSTRAINT_TYPE as type',
        'kcu.COLUMN_NAME as column',
        'referenced_kcu.TABLE_SCHEMA as foreign_schema',
        'referenced_kcu.TABLE_NAME as foreign_table',
        'referenced_kcu.COLUMN_NAME as foreign_column',
        'rc.DELETE_RULE as onDelete',
        'rc.UPDATE_RULE as onUpdate',
      ])
      .where('tc.CONSTRAINT_TYPE', 'in', neededConstraintTypes)
      .where('tc.TABLE_SCHEMA', 'not in', ['INFORMATION_SCHEMA', 'sys'])
      .execute(),
    clickhouse: async (db) => {
      // Clickhouse generally doesn't support traditional constraints like foreign key but we can fetch primary keys
      const query = await db
        .selectFrom('system.columns')
        .select([
          'database as schema',
          'table',
          'name as column',
        ])
        .where('is_in_primary_key', '=', 1)
        .where('database', 'not in', ['system', 'information_schema'])
        .execute()

      return query.map(row => ({
        ...row,
        name: 'primary_key',
        type: 'PRIMARY KEY',
        foreign_schema: null,
        foreign_table: null,
        foreign_column: null,
        onDelete: null,
        onUpdate: null,
      }))
    },
  },
})

export function resourceConstraintsQueryOptions({ connectionResource }: { connectionResource: typeof connectionsResources.$inferSelect }) {
  return queryOptions({
    queryFn: () => resourceConstraintsQuery.run(connectionResourceToQueryParams(connectionResource)),
    queryKey: ['connection-resource', connectionResource.id, 'constraints'],
  })
}
