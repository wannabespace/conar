import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'

import type { ConnectionResource } from '../../core/sync'
import {
  connectionResourceToQueryParams,
  createQuery,
} from '../../runtime/query'
import { unsupported } from '../shared/unsupported'
import type { functionsType } from './list'
import { routineKeyword } from './routine-kind'

type FunctionItem = typeof functionsType.infer

const definitionType = type({ definition: 'string | null' }).pipe(
  ({ definition }) => definition ?? ''
)

const functionDefinitionQuery = ({
  name,
  oid,
  schema,
  type: kind,
}: FunctionItem) =>
  createQuery({
    query: {
      clickhouse: unsupported('Functions'),
      mssql: async (db) => {
        const { rows } = await sql<{ definition: string | null }>`
          SELECT OBJECT_DEFINITION(OBJECT_ID(${sql.lit(`[${schema}].[${name}]`)})) AS definition
        `.execute(db)

        return { definition: rows[0]?.definition ?? null }
      },
      mysql: async (db) => {
        const { rows } = await sql<Record<string, string>>`
          SHOW CREATE ${routineKeyword(kind)} ${sql.id(schema, name)}
        `.execute(db)
        const [row] = rows

        return {
          definition:
            row?.['Create Function'] ?? row?.['Create Procedure'] ?? null,
        }
      },
      postgres: async (db) => {
        if (oid === undefined) {
          throw new Error(`Function "${name}" has no oid`)
        }
        const { rows } = await sql<{ definition: string | null }>`
          SELECT pg_get_functiondef(${sql.lit(oid)}) AS definition
        `.execute(db)

        return { definition: rows[0]?.definition ?? null }
      },
    },
    type: definitionType,
  })

export const functionDefinitionQueryOptions = ({
  connectionResource,
  item,
}: {
  connectionResource: ConnectionResource
  item: FunctionItem
}) =>
  queryOptions({
    queryFn: async () =>
      functionDefinitionQuery(item).run(
        await connectionResourceToQueryParams(connectionResource)
      ),
    queryKey: [
      'connection-resource',
      connectionResource.id,
      'function-definition',
      item.schema,
      item.name,
      item.identity ?? '',
    ],
  })
