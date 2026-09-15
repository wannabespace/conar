import { queryOptions } from '@tanstack/react-query'
import { sql } from 'kysely'

import type { ConnectionResource } from '../../core/sync'
import {
  connectionResourceToQueryParams,
  createQuery,
} from '../../runtime/query'
import {
  definitionType,
  mssqlObjectDefinition,
  readDefinition,
} from '../shared/definition'
import { unsupported } from '../shared/unsupported'
import type { functionsType } from './list'
import { routineKeyword } from './routine-kind'

type FunctionItem = typeof functionsType.infer

const functionDefinitionQuery = ({
  name,
  oid,
  schema,
  type: kind,
}: FunctionItem) =>
  createQuery({
    query: {
      clickhouse: unsupported('Functions'),
      mssql: readDefinition(mssqlObjectDefinition(schema, name)),
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
      postgres: (db) => {
        if (oid === undefined) {
          throw new Error(`Function "${name}" has no oid`)
        }

        return readDefinition(sql`pg_get_functiondef(${sql.lit(oid)})`)(db)
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
