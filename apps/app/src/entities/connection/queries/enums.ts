import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'

import type { ConnectionResource } from '../core/sync'
import { connectionResourceToQueryParams, createQuery } from '../runtime/query'

export const enumType = type({
  metadata: type({
    column: 'string?',
    isSet: 'boolean?',
    table: 'string?',
  }).optional(),
  name: 'string',
  schema: 'string',
  values: 'string[]',
})

export const findEnum = ({
  enums,
  column,
  table,
}: {
  enums: (typeof enumType.infer)[]
  column: {
    id: string
    enumName?: string
    type?: string
  }
  table: string
}) =>
  enums.find(
    (e) => e.metadata?.table === table && e.metadata?.column === column.id
  ) ??
  enums.find(
    (e) =>
      (column.enumName && e.name === column.enumName) ||
      (column.type && e.name === column.type)
  )

const clickhouseEnumRegex = /^Enum\d+\((?<values>.*)\)$/u
const clickhouseEnumValueRegex = /,(?=(?:[^']*'[^']*')*[^']*$)/u
const clickhouseEnumValuePairRegex = /'(?<value>[^']+)' *= *\d+/u

const parseClickhouseEnum = (dataType: string): string[] => {
  let inner = dataType
  let changed = true

  while (changed) {
    changed = false
    if (inner.startsWith('Array(') && inner.endsWith(')')) {
      inner = inner.slice(6, -1)
      changed = true
    }
    if (inner.startsWith('Nullable(') && inner.endsWith(')')) {
      inner = inner.slice(9, -1)
      changed = true
    }
    if (inner.startsWith('LowCardinality(') && inner.endsWith(')')) {
      inner = inner.slice(15, -1)
      changed = true
    }
  }

  const match = inner.match(clickhouseEnumRegex)
  const valuesGroup = match?.groups?.values

  if (!valuesGroup) {
    return []
  }

  const pairs = valuesGroup.split(clickhouseEnumValueRegex)

  return pairs
    .map((pair) => {
      const valMatch = pair.match(clickhouseEnumValuePairRegex)
      return valMatch?.groups?.value ?? ''
    })
    .filter(Boolean)
}

const mysqlEnumOrSetRegex = /^(?<kind>enum|set)\(/iu

// Helper to parse values from enum/set column type string
const parseMysqlEnumOrSet = (typeString: string): string[] => {
  // Remove "enum(" or "set(" prefix and ending ")"

  const valuesString = typeString
    .replace(mysqlEnumOrSetRegex, '')
    .replace(/\)$/u, '')
  // Split values; values are quoted (single quotes), can have commas inside values if escaped, etc.
  // This splits on commas only outside of single quotes
  return valuesString.length === 0
    ? []
    : valuesString
        .split(/,(?=(?:[^']*'[^']*')*[^']*$)/u)
        .map((v) =>
          v.trim().replace(/^'/u, '').replace(/'$/u, '').replaceAll("''", "'")
        )
}

const resourceEnumsQuery = createQuery({
  query: {
    clickhouse: async (db) => {
      const query = await db
        .selectFrom('information_schema.columns')
        .select([
          'table_schema as schema',
          'table_name as table',
          'column_name as name',
          'data_type as type',
        ])
        .where(({ and, eb }) =>
          and([
            eb('table_schema', 'not in', [
              'INFORMATION_SCHEMA',
              'information_schema',
              'system',
            ]),
            eb('data_type', 'ilike', '%Enum%'),
          ])
        )
        .execute()

      return query
        .map(
          (row) =>
            ({
              metadata: {
                column: row.name,
                table: row.table,
              },
              name: row.name,
              schema: row.schema,
              values: parseClickhouseEnum(row.type),
            }) satisfies typeof enumType.infer
        )
        .filter((res) => res.values.length > 0)
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
            eb('TABLE_SCHEMA', 'not in', [
              'INFORMATION_SCHEMA',
              'information_schema',
              'system',
            ]),
            or([eb('DATA_TYPE', '=', 'enum'), eb('DATA_TYPE', '=', 'set')]),
          ])
        )
        .groupBy(['TABLE_SCHEMA', 'TABLE_NAME', 'COLUMN_NAME', 'DATA_TYPE'])
        .execute()

      return query.map(
        (row) =>
          ({
            metadata: {
              column: row.name,
              isSet: row.data_type === 'set',
              table: row.table,
            },
            name: row.name,
            schema: row.schema,
            values: parseMysqlEnumOrSet(row.value),
          }) satisfies typeof enumType.infer
      )
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
            eb('TABLE_SCHEMA', 'not in', [
              'mysql',
              'information_schema',
              'performance_schema',
              'sys',
            ]),
            or([eb('DATA_TYPE', '=', 'enum'), eb('DATA_TYPE', '=', 'set')]),
          ])
        )
        .groupBy([
          'TABLE_SCHEMA',
          'TABLE_NAME',
          'COLUMN_NAME',
          'COLUMN_TYPE',
          'DATA_TYPE',
        ])
        .execute()

      return query.map(
        (row) =>
          ({
            metadata: {
              column: row.name,
              isSet: row.data_type === 'set',
              table: row.table,
            },
            name: row.name,
            schema: row.schema,
            values: parseMysqlEnumOrSet(row.value),
          }) satisfies typeof enumType.infer
      )
    },
    postgres: async (db) => {
      const query = await db
        .selectFrom('pg_type')
        .innerJoin('pg_enum', 'pg_type.oid', 'pg_enum.enumtypid')
        .innerJoin(
          'pg_catalog.pg_namespace',
          'pg_type.typnamespace',
          'pg_catalog.pg_namespace.oid'
        )
        .select([
          'pg_catalog.pg_namespace.nspname as schema',
          'pg_type.typname as name',
          'pg_enum.enumlabel as value',
        ])
        .where('pg_catalog.pg_namespace.nspname', 'not in', [
          'pg_catalog',
          'information_schema',
        ])
        .execute()

      const grouped = new Map<string, typeof enumType.infer>()

      for (const row of query) {
        const key = `${row.schema}.${row.name}`
        const existing = grouped.get(key)
        if (existing) {
          existing.values.push(row.value)
        } else {
          grouped.set(key, {
            name: row.name,
            schema: row.schema,
            values: [row.value],
          })
        }
      }

      return [...grouped.values()]
    },
  },
  type: enumType.array(),
})

export const resourceEnumsQueryOptions = ({
  connectionResource,
}: {
  connectionResource: ConnectionResource
}) =>
  queryOptions({
    queryFn: async () =>
      resourceEnumsQuery.run(
        await connectionResourceToQueryParams(connectionResource)
      ),
    queryKey: ['connection-resource', connectionResource.id, 'enums'],
  })
