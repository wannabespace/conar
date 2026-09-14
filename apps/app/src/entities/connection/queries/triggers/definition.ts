import { queryOptions } from '@tanstack/react-query'
import { type } from 'arktype'
import { sql } from 'kysely'

import type { ConnectionResource } from '../../core/sync'
import {
  connectionResourceToQueryParams,
  createQuery,
} from '../../runtime/query'
import { unsupported } from '../shared/unsupported'
import type { triggersType } from './list'

type TriggerItem = typeof triggersType.infer

const definitionType = type({ definition: 'string | null' }).pipe(
  ({ definition }) => definition ?? ''
)

const triggerDefinitionQuery = ({ name, oid, schema }: TriggerItem) =>
  createQuery({
    query: {
      clickhouse: unsupported('Triggers'),
      mssql: async (db) => {
        const { rows } = await sql<{ definition: string | null }>`
          SELECT OBJECT_DEFINITION(OBJECT_ID(${sql.lit(`[${schema}].[${name}]`)})) AS definition
        `.execute(db)

        return { definition: rows[0]?.definition ?? null }
      },
      mysql: async (db) => {
        const { rows } = await sql<Record<string, string>>`
          SHOW CREATE TRIGGER ${sql.id(schema, name)}
        `.execute(db)

        return { definition: rows[0]?.['SQL Original Statement'] ?? null }
      },
      postgres: async (db) => {
        if (oid === undefined) {
          throw new Error(`Trigger "${name}" has no oid`)
        }
        const { rows } = await sql<{ definition: string | null }>`
          SELECT pg_get_triggerdef(${sql.lit(oid)}, true) AS definition
        `.execute(db)

        return { definition: rows[0]?.definition ?? null }
      },
    },
    type: definitionType,
  })

export const triggerDefinitionQueryOptions = ({
  connectionResource,
  item,
}: {
  connectionResource: ConnectionResource
  item: TriggerItem
}) =>
  queryOptions({
    queryFn: async () =>
      triggerDefinitionQuery(item).run(
        await connectionResourceToQueryParams(connectionResource)
      ),
    queryKey: [
      'connection-resource',
      connectionResource.id,
      'trigger-definition',
      item.schema,
      item.table,
      item.name,
    ],
  })
