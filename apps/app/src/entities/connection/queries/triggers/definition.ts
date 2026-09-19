import { unsupported } from '@tamery/shared/utils/unsupported'
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
import type { triggersType } from './list'

type TriggerItem = typeof triggersType.infer

const triggerDefinitionQuery = ({ name, oid, schema }: TriggerItem) =>
  createQuery({
    query: {
      clickhouse: unsupported('Triggers'),
      mssql: readDefinition(mssqlObjectDefinition(schema, name)),
      mysql: async (db) => {
        const { rows } = await sql<Record<string, string>>`
          SHOW CREATE TRIGGER ${sql.id(schema, name)}
        `.execute(db)

        return { definition: rows[0]?.['SQL Original Statement'] ?? null }
      },
      postgres: (db) => {
        if (oid === undefined) {
          throw new Error(`Trigger "${name}" has no oid`)
        }

        return readDefinition(sql`pg_get_triggerdef(${sql.lit(oid)}, true)`)(db)
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
