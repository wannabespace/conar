import { type } from 'arktype'
import { createQuery } from '../query'

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
})
  .pipe(({ type, foreign_column, foreign_table, foreign_schema, ...item }) => ({
    ...item,
    type: constraintTypeLabelMap[type as typeof neededConstraintTypes[number]],
    foreignTable: foreign_table,
    foreignColumn: foreign_column,
    foreignSchema: foreign_schema,
  }))

export const constraintsQuery = createQuery({
  type: constraintsType.array(),
  query: () => ({
    postgres: db => db
      .selectFrom('information_schema.table_constraints')
      .leftJoin('information_schema.key_column_usage', 'information_schema.table_constraints.constraint_name', 'information_schema.key_column_usage.constraint_name')
      .leftJoin('information_schema.constraint_column_usage', 'information_schema.table_constraints.constraint_name', 'information_schema.constraint_column_usage.constraint_name')
      .select([
        'information_schema.table_constraints.table_schema as schema',
        'information_schema.table_constraints.table_name as table',
        'information_schema.table_constraints.constraint_name as name',
        'information_schema.table_constraints.constraint_type as type',
        'information_schema.key_column_usage.column_name as column',
        'information_schema.constraint_column_usage.table_schema as foreign_schema',
        'information_schema.constraint_column_usage.table_name as foreign_table',
        'information_schema.constraint_column_usage.column_name as foreign_column',
      ])
      .where('information_schema.table_constraints.constraint_type', 'in', neededConstraintTypes)
      .where('information_schema.constraint_column_usage.table_schema', 'not like', 'pg_%')
      .execute(),
    mysql: db => db
      .selectFrom('information_schema.TABLE_CONSTRAINTS')
      .leftJoin('information_schema.KEY_COLUMN_USAGE', join => join
        .onRef('information_schema.TABLE_CONSTRAINTS.CONSTRAINT_NAME', '=', 'information_schema.KEY_COLUMN_USAGE.CONSTRAINT_NAME')
        .onRef('information_schema.TABLE_CONSTRAINTS.CONSTRAINT_SCHEMA', '=', 'information_schema.KEY_COLUMN_USAGE.CONSTRAINT_SCHEMA')
        .onRef('information_schema.TABLE_CONSTRAINTS.TABLE_SCHEMA', '=', 'information_schema.KEY_COLUMN_USAGE.TABLE_SCHEMA')
        .onRef('information_schema.TABLE_CONSTRAINTS.TABLE_NAME', '=', 'information_schema.KEY_COLUMN_USAGE.TABLE_NAME'))
      .select([
        'information_schema.TABLE_CONSTRAINTS.TABLE_SCHEMA as schema',
        'information_schema.TABLE_CONSTRAINTS.TABLE_NAME as table',
        'information_schema.TABLE_CONSTRAINTS.CONSTRAINT_NAME as name',
        'information_schema.TABLE_CONSTRAINTS.CONSTRAINT_TYPE as type',
        'information_schema.KEY_COLUMN_USAGE.COLUMN_NAME as column',
        'information_schema.KEY_COLUMN_USAGE.REFERENCED_TABLE_SCHEMA as foreign_schema',
        'information_schema.KEY_COLUMN_USAGE.REFERENCED_TABLE_NAME as foreign_table',
        'information_schema.KEY_COLUMN_USAGE.REFERENCED_COLUMN_NAME as foreign_column',
      ])
      .where('information_schema.TABLE_CONSTRAINTS.CONSTRAINT_TYPE', 'in', neededConstraintTypes)
      .where('information_schema.TABLE_CONSTRAINTS.TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])
      .execute(),
    mssql: db => db
      .selectFrom('information_schema.TABLE_CONSTRAINTS')
      .leftJoin('information_schema.KEY_COLUMN_USAGE', 'information_schema.TABLE_CONSTRAINTS.CONSTRAINT_NAME', 'information_schema.KEY_COLUMN_USAGE.CONSTRAINT_NAME')
      .leftJoin('information_schema.CONSTRAINT_COLUMN_USAGE', 'information_schema.TABLE_CONSTRAINTS.CONSTRAINT_NAME', 'information_schema.CONSTRAINT_COLUMN_USAGE.CONSTRAINT_NAME')
      .select([
        'information_schema.TABLE_CONSTRAINTS.TABLE_SCHEMA as schema',
        'information_schema.TABLE_CONSTRAINTS.TABLE_NAME as table',
        'information_schema.TABLE_CONSTRAINTS.CONSTRAINT_NAME as name',
        'information_schema.TABLE_CONSTRAINTS.CONSTRAINT_TYPE as type',
        'information_schema.KEY_COLUMN_USAGE.COLUMN_NAME as column',
        'information_schema.CONSTRAINT_COLUMN_USAGE.TABLE_SCHEMA as foreign_schema',
        'information_schema.CONSTRAINT_COLUMN_USAGE.TABLE_NAME as foreign_table',
        'information_schema.CONSTRAINT_COLUMN_USAGE.COLUMN_NAME as foreign_column',
      ])
      .where('information_schema.TABLE_CONSTRAINTS.CONSTRAINT_TYPE', 'in', neededConstraintTypes)
      .where('information_schema.CONSTRAINT_COLUMN_USAGE.TABLE_SCHEMA', 'not like', 'pg_%')
      .execute(),
    clickhouse: async () => {
      // ClickHouse doesn't support foreign keys and constraints
      return []
    },
  }),
})
