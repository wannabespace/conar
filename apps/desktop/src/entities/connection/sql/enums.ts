import type { Column } from '../components/table/utils'
import { type } from 'arktype'
import { createQuery } from '../query'

export const enumType = type({
  schema: 'string',
  name: 'string',
  values: 'string[]',
  metadata: type({
    isSet: 'boolean?',
    table: 'string?',
    column: 'string?',
  }).optional(),
})

export function findEnum(enums: typeof enumType.infer[], column: Column, table: string) {
  return enums.find(e => (e.metadata?.table === table && e.metadata?.column === column.id)
    || (column.enum && e.name === column.enum)
    || (column.type && e.name === column.type),
  )
}

function parseClickhouseEnum(type: string): string[] {
  const match = type.match(/^Enum\d+\((.*)\)$/)

  if (!match || !match[1])
    return []

  const pairs = match[1].split(/,(?=(?:[^']*'[^']*')*[^']*$)/)

  return pairs.map((pair) => {
    const valMatch = pair.match(/'([^']+)' *= *\d+/)
    return valMatch && valMatch[1] ? valMatch[1] : ''
  }).filter(Boolean)
}

// Helper to parse values from enum/set column type string
function parseMysqlEnumOrSet(typeString: string): string[] {
  // Remove "enum(" or "set(" prefix and ending ")"
  const valuesString = typeString.replace(/^(enum|set)\(/i, '').replace(/\)$/, '')
  // Split values; values are quoted (single quotes), can have commas inside values if escaped, etc.
  // This splits on commas only outside of single quotes
  return valuesString.length === 0
    ? []
    : valuesString.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map(v => v.trim().replace(/^'/, '').replace(/'$/, '').replace(/''/g, '\''))
}

export const enumsQuery = createQuery({
  type: enumType.array(),
  query: () => ({
    postgres: async (db) => {
      const query = await db
        .selectFrom('pg_type')
        .innerJoin('pg_enum', 'pg_type.oid', 'pg_enum.enumtypid')
        .innerJoin('pg_catalog.pg_namespace', 'pg_type.typnamespace', 'pg_catalog.pg_namespace.oid')
        .select([
          'pg_catalog.pg_namespace.nspname as schema',
          'pg_type.typname as name',
          'pg_enum.enumlabel as value',
        ])
        .where('pg_catalog.pg_namespace.nspname', 'not in', ['pg_catalog', 'information_schema'])
        .execute()

      const grouped = new Map<string, typeof enumType.infer>()

      for (const row of query) {
        const key = `${row.schema}.${row.name}`
        if (grouped.has(key)) {
          grouped.get(key)!.values.push(row.value)
        }
        else {
          grouped.set(key, { schema: row.schema, name: row.name, values: [row.value] })
        }
      }

      return Array.from(grouped.values())
    },
    mysql: async (db) => {
      const query = await db
        .selectFrom('information_schema.COLUMNS')
        .select([
          'TABLE_SCHEMA as schema',
          'TABLE_NAME as table',
          'COLUMN_TYPE as value',
          'COLUMN_NAME as name',
          'DATA_TYPE as data_type',
        ])
        .where(({ or, and, eb }) =>
          and([
            eb('TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys']),
            or([
              eb('DATA_TYPE', '=', 'enum'),
              eb('DATA_TYPE', '=', 'set'),
            ]),
          ]),
        )
        .groupBy(['TABLE_SCHEMA', 'TABLE_NAME', 'COLUMN_NAME', 'COLUMN_TYPE', 'DATA_TYPE'])
        .execute()

      return query
        .map(row => ({
          name: row.name,
          schema: row.schema,
          metadata: {
            table: row.table,
            column: row.name,
            isSet: row.data_type === 'set',
          },
          values: parseMysqlEnumOrSet(row.value),
        } satisfies typeof enumType.infer))
    },
    mssql: async (db) => {
      const query = await db
        .selectFrom('information_schema.COLUMNS')
        .select([
          'TABLE_SCHEMA as schema',
          'TABLE_NAME as table',
          'DATA_TYPE as value',
          'COLUMN_NAME as name',
          'DATA_TYPE as data_type',
        ])
        .where(({ or, and, eb }) =>
          and([
            eb('TABLE_SCHEMA', 'not in', ['INFORMATION_SCHEMA', 'information_schema', 'system']),
            or([
              eb('DATA_TYPE', '=', 'enum'),
              eb('DATA_TYPE', '=', 'set'),
            ]),
          ]),
        )
        .groupBy(['TABLE_SCHEMA', 'TABLE_NAME', 'COLUMN_NAME', 'DATA_TYPE'])
        .execute()

      return query
        .map(row => ({
          name: row.name,
          schema: row.schema,
          metadata: {
            table: row.table,
            column: row.name,
            isSet: row.data_type === 'set',
          },
          values: parseMysqlEnumOrSet(row.value),
        } satisfies typeof enumType.infer))
    },
    clickhouse: async (db) => {
      const query = await db
        .selectFrom('information_schema.columns')
        .select([
          'table_schema as schema',
          'table_name as table',
          'column_name as name',
          'data_type as type',
        ])
        .where(({ and, eb }) => and([
          eb('table_schema', 'not in', ['INFORMATION_SCHEMA', 'information_schema', 'system']),
          eb('data_type', 'ilike', 'Enum%'),
        ]))
        .execute()

      return query
        .map(row => ({
          name: row.name,
          schema: row.schema,
          metadata: {
            table: row.table,
            column: row.name,
          },
          values: parseClickhouseEnum(row.type),
        } satisfies typeof enumType.infer))
        .filter(res => res.values.length > 0)
    },
  }),
})
