import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'

import type { ConnectionResource } from '../../core/sync'
import {
  connectionResourceToQueryParams,
  createQuery,
} from '../../runtime/query'

const enumDependentType = type({
  column: 'string',
  default: 'string | null',
  isArray: 'boolean',
  schema: 'string',
  table: 'string',
})

export type EnumDependent = typeof enumDependentType.infer

const dependentsQuery = ({ name, schema }: { name: string; schema: string }) =>
  createQuery({
    query: {
      clickhouse: () => Promise.resolve([]),
      mssql: () => Promise.resolve([]),
      mysql: () => Promise.resolve([]),
      postgres: async (db) => {
        const { rows } = await sql<EnumDependent>`
          SELECT
            n.nspname AS schema,
            c.relname AS "table",
            a.attname AS column,
            (at.typelem = e.oid) AS "isArray",
            pg_get_expr(d.adbin, d.adrelid) AS "default"
          FROM pg_catalog.pg_type e
          JOIN pg_catalog.pg_namespace en ON en.oid = e.typnamespace
          JOIN pg_catalog.pg_attribute a ON a.atttypid = e.oid OR a.atttypid = e.typarray
          JOIN pg_catalog.pg_type at ON at.oid = a.atttypid
          JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
          JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          LEFT JOIN pg_catalog.pg_attrdef d
            ON d.adrelid = a.attrelid AND d.adnum = a.attnum
          WHERE e.typname = ${sql.lit(name)}
            AND en.nspname = ${sql.lit(schema)}
            AND a.attnum > 0
            AND NOT a.attisdropped
            AND c.relkind IN ('r', 'p')
        `.execute(db)

        return rows
      },
    },
    type: enumDependentType.array(),
  })

export const enumDependentsQueryOptions = ({
  connectionResource,
  name,
  schema,
}: {
  connectionResource: ConnectionResource
  name: string
  schema: string
}) =>
  queryOptions({
    queryFn: async () =>
      dependentsQuery({ name, schema }).run(
        await connectionResourceToQueryParams(connectionResource)
      ),
    queryKey: [
      'connection-resource',
      connectionResource.id,
      'enum-dependents',
      schema,
      name,
    ],
  })
