import type { SqlSource, TableRef } from '@tamery/monaco/sql-language'
import {
  attachGhostTextEscape,
  attachSqlDiagnostics,
  bindSqlModel,
  EMPTY_CATALOG,
} from '@tamery/monaco/sql-language'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { SqlCatalog } from '@tamery/sql'
import { dialects, findTableWithSchema } from '@tamery/sql'
import { matchQuery } from '@tanstack/react-query'
import type { editor } from 'monaco-editor'

import { defaultSchemaOf } from '~/core/catalog/capabilities'
import type { ConnectionResource } from '~/core/connection/sync'
import { resourceEnumsQueryOptions } from '~/core/queries/enums/list'
import { resourceTableColumnsQueryOptions } from '~/core/queries/tables/columns'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { permix } from '~/core/user/permissions'
import { orpc } from '~/lib/orpc'
import { queryClient } from '~/lib/query-client'
import { appStore } from '~/store'

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
    exactNames: dialects[connectionType].foldsNames,
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
              comment: column.comment ?? undefined,
              name: column.id,
              nullable: column.isNullable,
              // Postgres reports enum columns as `USER-DEFINED`; the label names the enum.
              type: column.typeLabel,
            })) ?? null,
        comment: table.comment,
        kind: table.type,
        name: table.name,
      })),
    })),
  }
}

const sqlSourceFor = (
  connectionResource: ConnectionResource,
  connectionType: ConnectionType
): SqlSource => {
  const catalog = () => sqlCatalogOf(connectionResource, connectionType)
  const tablesOptions = resourceTablesAndSchemasQueryOptions({
    connectionResource,
  })
  const enumsOptions = resourceEnumsQueryOptions({ connectionResource })
  const uncachedColumns = (refs: TableRef[]) => {
    const current = catalog()
    return refs.flatMap((ref) => {
      // Schema and table from one lookup, so the columns fetched are the table suggestions resolve to.
      const found = findTableWithSchema(current, ref.name, ref.schema)
      return found?.table.columns === null
        ? [
            resourceTableColumnsQueryOptions({
              connectionResource,
              schema: found.schema,
              table: found.table.name,
            }),
          ]
        : []
    })
  }
  const loadMissing = async (refs: TableRef[]) => {
    await Promise.all([
      queryClient.query({ ...tablesOptions, staleTime: 'static' }),
      queryClient.query({ ...enumsOptions, staleTime: 'static' }),
    ])
    await Promise.all(
      uncachedColumns(refs).map((options) =>
        queryClient.query({ ...options, staleTime: 'static' })
      )
    )
  }
  return {
    catalog,
    complete: (input, signal) =>
      orpc.ai.completeSQL.call(
        { ...input, type: connectionType },
        { context: { silent: true }, signal }
      ),
    ghostTextEnabled: () =>
      appStore.get().isOnline && permix.check('ai.sql.use'),
    load: (refs) =>
      [tablesOptions, enumsOptions].every(
        (options) => queryClient.getQueryData(options.queryKey) !== undefined
      ) && uncachedColumns(refs).length === 0
        ? undefined
        : loadMissing(refs),
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

export const attachSqlSource = (
  codeEditor: editor.IStandaloneCodeEditor,
  connectionResource: ConnectionResource,
  connectionType: ConnectionType
) => {
  const source = sqlSourceFor(connectionResource, connectionType)
  const model = codeEditor.getModel()
  if (model) {
    bindSqlModel(model, source)
  }
  const detachDiagnostics = attachSqlDiagnostics(codeEditor, source)
  const detachEscape = attachGhostTextEscape(codeEditor)
  return () => {
    detachDiagnostics()
    detachEscape()
  }
}
