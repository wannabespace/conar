import type { SqlSource, TableRef } from '@tamery/monaco/sql-language'
import { EMPTY_CATALOG } from '@tamery/monaco/sql-language'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { SqlCatalog } from '@tamery/sql'
import { locateTable } from '@tamery/sql'
import { matchQuery } from '@tanstack/react-query'

import type { ConnectionResource } from '~/entities/connection/core/sync'
import { resourceEnumsQueryOptions } from '~/entities/connection/queries/enums/list'
import { resourceTableColumnsQueryOptions } from '~/entities/connection/queries/tables/columns'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'
import { hasSubscription } from '~/entities/user/hooks/use-subscription'
import { orpc } from '~/lib/orpc'
import { queryClient } from '~/lib/query-client'
import { appStore } from '~/store'

import { defaultSchemaOf } from './capabilities'

const sqlCatalogOf = (
  connectionResource: ConnectionResource,
  connectionType: ConnectionType
): SqlCatalog => {
  const tables = queryClient.getQueryData(
    resourceTablesAndSchemasQueryOptions({ connectionResource }).queryKey
  )
  const enums = queryClient.getQueryData(
    resourceEnumsQueryOptions({ connectionResource }).queryKey
  )
  if (!tables) {
    return EMPTY_CATALOG
  }
  return {
    defaultSchema: defaultSchemaOf(connectionType, connectionResource.name),
    enums: (enums ?? []).map(({ metadata, name, values }) => ({
      column: metadata?.column,
      name,
      table: metadata?.table,
      values,
    })),
    schemas: tables.schemas.map((schema) => ({
      name: schema.name,
      tables: schema.tables.map((table) => ({
        columns:
          queryClient
            .getQueryData(
              resourceTableColumnsQueryOptions({
                connectionResource,
                schema: schema.name,
                table: table.name,
              }).queryKey
            )
            ?.map((column) => ({
              name: column.id,
              nullable: column.isNullable,
              // Postgres reports enum columns as `USER-DEFINED`; the label names the enum.
              type: column.typeLabel,
            })) ?? null,
        kind: table.type,
        name: table.name,
      })),
    })),
  }
}

const loadColumns = (
  connectionResource: ConnectionResource,
  catalog: SqlCatalog,
  refs: TableRef[]
) =>
  Promise.all(
    refs.flatMap((ref) => {
      // Schema and table from one lookup, so the columns fetched are the table suggestions resolve to.
      const found = locateTable(catalog, ref.name, ref.schema)
      return found?.table.columns === null
        ? [
            queryClient.ensureQueryData(
              resourceTableColumnsQueryOptions({
                connectionResource,
                schema: found.schema,
                table: found.table.name,
              })
            ),
          ]
        : []
    })
  )

export const sqlSourceFor = (
  connectionResource: ConnectionResource,
  connectionType: ConnectionType
): SqlSource => {
  queryClient.prefetchQuery(resourceEnumsQueryOptions({ connectionResource }))
  queryClient.prefetchQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource })
  )
  const catalog = () => sqlCatalogOf(connectionResource, connectionType)
  return {
    catalog,
    complete: (input, signal) =>
      orpc.ai.completeSQL.call(
        { ...input, type: connectionType },
        { context: { silent: true }, signal }
      ),
    ghostTextEnabled: () => appStore.get().isOnline && hasSubscription(),
    loadColumns: (refs) => loadColumns(connectionResource, catalog(), refs),
    onCatalogChange: (listener) =>
      queryClient.getQueryCache().subscribe((event) => {
        if (
          event.type === 'updated' &&
          matchQuery(
            { queryKey: ['connection-resource', connectionResource.id] },
            event.query
          )
        ) {
          listener()
        }
      }),
    type: connectionType,
  }
}
