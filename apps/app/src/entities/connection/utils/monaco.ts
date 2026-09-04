import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { languages } from 'monaco-editor'
import type { CompletionService, ICompletionItem } from 'monaco-sql-languages'
import { EntityContextType, LanguageIdEnum } from 'monaco-sql-languages'

import type { ConnectionResource } from '~/entities/connection/core'
import { queryClient } from '~/main'

import { resourceTableColumnsQueryOptions } from '../queries/columns'
import { resourceEnumsQueryOptions } from '../queries/enums'
import { resourceTablesAndSchemasQueryOptions } from '../queries/tables-and-schemas'
import { getConnectionResourceStore } from '../store'

export const sqlDialects = {
  clickhouse: LanguageIdEnum.MYSQL,
  mssql: LanguageIdEnum.PG,
  mysql: LanguageIdEnum.MYSQL,
  postgres: LanguageIdEnum.PG,
} satisfies Record<ConnectionType, LanguageIdEnum>

const keywordPriority = [
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'OUTER',
  'ON',
  'GROUP',
  'BY',
  'ORDER',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'CREATE',
  'TABLE',
  'ALTER',
  'DROP',
]

const dotMatchesRegex = /(?<tableRef>\w+(?:\.\w+)*)\.\s*$/gu

export const connectionCompletionService = (
  connectionResource: ConnectionResource
): CompletionService => {
  const store = getConnectionResourceStore(connectionResource.id)
  queryClient.prefetchQuery(
    resourceTablesAndSchemasQueryOptions({
      connectionResource,
      showSystem: store.get().showSystem,
    })
  )
  queryClient.prefetchQuery(resourceEnumsQueryOptions({ connectionResource }))

  return async (
    model,
    position,
    _completionContext,
    suggestions,
    _entities,
    _snippets
  ) => {
    if (!suggestions) {
      return []
    }

    const { keywords, syntax } = suggestions

    const keywordItems = keywords.map((kw) => {
      const index = keywordPriority.indexOf(kw.toUpperCase())
      const priority = index === -1 ? 100 : index
      return {
        detail: 'keyword',
        kind: languages.CompletionItemKind.Keyword,
        label: kw,
        sortText: `3${priority.toString().padStart(3, '0')}${kw}`,
      } satisfies ICompletionItem
    })

    const [tablesAndSchemas, enums] = await Promise.all([
      queryClient.ensureQueryData(
        resourceTablesAndSchemasQueryOptions({
          connectionResource,
          showSystem: store.get().showSystem,
        })
      ),
      queryClient.ensureQueryData(
        resourceEnumsQueryOptions({ connectionResource })
      ),
    ])

    const items: ICompletionItem[] = []

    const textBeforeCursor = model.getValueInRange({
      endColumn: position.column,
      endLineNumber: position.lineNumber,
      startColumn: 1,
      startLineNumber: 1,
    })

    const dotMatches = [...textBeforeCursor.matchAll(dotMatchesRegex)]
    const isTableContext = syntax.some(
      (item) => item.syntaxContextType === EntityContextType.TABLE
    )
    const isColumnContext = syntax.some(
      (item) => item.syntaxContextType === EntityContextType.COLUMN
    )

    if (dotMatches.length > 0) {
      const tableRef =
        dotMatches.at(-1)?.groups?.tableRef ?? dotMatches.at(-1)?.[1]

      if (tableRef) {
        const parts = tableRef.split('.')
        const [firstPart = '', secondPart] = parts
        const schemaName = parts.length === 2 ? firstPart : 'public'
        const tableName = parts.length === 2 ? (secondPart ?? '') : firstPart

        const schema = tablesAndSchemas?.schemas.find(
          (s) => s.name === schemaName
        )
        const table = schema?.tables.find((t) => t.name === tableName)

        if (table) {
          const columns = await queryClient.ensureQueryData(
            resourceTableColumnsQueryOptions({
              connectionResource,
              schema: schemaName,
              table: tableName,
            })
          )
          const columnItems = columns.map(
            (col) =>
              ({
                detail: `${col.type}${col.isNullable ? ' (nullable)' : ' (not null)'}`,
                insertText: col.id,
                kind: languages.CompletionItemKind.Field,
                label: col.id,
                sortText: `1${col.id}`,
              }) satisfies ICompletionItem
          )
          return [...columnItems, ...keywordItems]
        }
      }
      return keywordItems
    }

    if (tablesAndSchemas && isColumnContext && !isTableContext) {
      const columnPromises = tablesAndSchemas.schemas.flatMap((schema) =>
        schema.tables.map(async (tableEntry) => {
          const columns = await queryClient.ensureQueryData(
            resourceTableColumnsQueryOptions({
              connectionResource,
              schema: schema.name,
              table: tableEntry.name,
            })
          )
          return columns.map(
            (col) =>
              ({
                detail: `${col.type}${col.isNullable ? ' (nullable)' : ' (not null)'}`,
                insertText: col.id,
                kind: languages.CompletionItemKind.Field,
                label: col.id,
                sortText: `1${col.id}`,
              }) satisfies ICompletionItem
          )
        })
      )
      const columnResults = await Promise.all(columnPromises)
      const allColumns = columnResults.flat()

      items.push(
        ...allColumns.filter(
          (item, i, arr) => arr.findIndex((x) => x.label === item.label) === i
        )
      )
    }

    if (tablesAndSchemas) {
      const tableItems = tablesAndSchemas.schemas.flatMap((schema) =>
        schema.tables.flatMap((tableEntry) => [
          {
            detail: `${tableEntry.type} (${schema.name})`,
            insertText: tableEntry.name,
            kind: languages.CompletionItemKind.Class,
            label: tableEntry.name,
            sortText: `2${tableEntry.name}`,
          } satisfies ICompletionItem,
          {
            detail: `${tableEntry.type} (${schema.name})`,
            insertText: `${schema.name}.${tableEntry.name}`,
            kind: languages.CompletionItemKind.Class,
            label: `${schema.name}.${tableEntry.name}`,
            sortText: `2${schema.name}.${tableEntry.name}`,
          } satisfies ICompletionItem,
        ])
      )

      items.push(...tableItems)
    }

    if (enums) {
      const enumItems = enums.flatMap((enumItem) =>
        enumItem.values.map(
          (value) =>
            ({
              detail: `enum value (${enumItem.schema}.${enumItem.name})`,
              insertText: value,
              kind: languages.CompletionItemKind.EnumMember,
              label: value,
              sortText: `3${value}`,
            }) satisfies ICompletionItem
        )
      )

      items.push(...enumItems)
    }

    return [...items, ...keywordItems]
  }
}
