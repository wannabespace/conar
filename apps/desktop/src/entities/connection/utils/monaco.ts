import type { CompletionService, ICompletionItem } from 'monaco-sql-languages'
import type { connections } from '~/drizzle'
import { languages } from 'monaco-editor'
import { EntityContextType } from 'monaco-sql-languages'
import { queryClient } from '~/main'
import { connectionTableColumnsQuery } from '../queries/columns'
import { connectionEnumsQuery } from '../queries/enums'
import { connectionTablesAndSchemasQuery } from '../queries/tables-and-schemas'
import { connectionStore } from '../store'

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

export function connectionCompletionService(connection: typeof connections.$inferSelect): CompletionService {
  const store = connectionStore(connection.id)
  queryClient.prefetchQuery(connectionTablesAndSchemasQuery({ connection, showSystem: store.state.showSystem }))
  queryClient.prefetchQuery(connectionEnumsQuery({ connection }))

  return async (
    model,
    position,
    _completionContext,
    suggestions,
    _entities,
    _snippets,
  ) => {
    if (!suggestions)
      return []

    const { keywords, syntax } = suggestions

    const keywordItems = keywords.map((kw) => {
      const index = keywordPriority.indexOf(kw.toUpperCase())
      const priority = index === -1 ? 100 : index
      return {
        label: kw,
        kind: languages.CompletionItemKind.Keyword,
        detail: 'keyword',
        sortText: `3${priority.toString().padStart(3, '0')}${kw}`,
      } satisfies ICompletionItem
    })

    const [tablesAndSchemas, enums] = await Promise.all([
      queryClient.ensureQueryData(connectionTablesAndSchemasQuery({ connection, showSystem: store.state.showSystem })),
      queryClient.ensureQueryData(connectionEnumsQuery({ connection })),
    ])

    const items: ICompletionItem[] = []

    const textBeforeCursor = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    })

    const dotMatches = [...textBeforeCursor.matchAll(/(\w+(?:\.\w+)*)\.\s*$/g)]
    const isTableContext = syntax.some(item => item.syntaxContextType === EntityContextType.TABLE)
    const isColumnContext = syntax.some(item => item.syntaxContextType === EntityContextType.COLUMN)

    if (dotMatches.length > 0) {
      const tableRef = dotMatches[dotMatches.length - 1]?.[1]

      if (tableRef) {
        const parts = tableRef.split('.')
        const schemaName = parts.length === 2 ? parts[0]! : 'public'
        const tableName = parts.length === 2 ? parts[1]! : parts[0]!

        const schema = tablesAndSchemas?.schemas.find(s => s.name === schemaName)
        const table = schema?.tables.find(t => t === tableName)

        if (table) {
          const columns = await queryClient.ensureQueryData(
            connectionTableColumnsQuery({ connection, schema: schemaName, table: tableName }),
          )
          const columnItems = columns.map(col => ({
            label: col.id,
            kind: languages.CompletionItemKind.Field,
            detail: `${col.type}${col.isNullable ? ' (nullable)' : ' (not null)'}`,
            sortText: `1${col.id}`,
            insertText: col.id,
          } satisfies ICompletionItem))
          return [...columnItems, ...keywordItems]
        }
      }
      return keywordItems
    }

    if (tablesAndSchemas && isColumnContext && !isTableContext) {
      const columnPromises = tablesAndSchemas.schemas.flatMap(schema =>
        schema.tables.map(async (tableName) => {
          const columns = await queryClient.ensureQueryData(
            connectionTableColumnsQuery({ connection, schema: schema.name, table: tableName }),
          )
          return columns.map(col => ({
            label: col.id,
            kind: languages.CompletionItemKind.Field,
            detail: `${col.type}${col.isNullable ? ' (nullable)' : ' (not null)'}`,
            sortText: `1${col.id}`,
            insertText: col.id,
          } satisfies ICompletionItem))
        }),
      )
      const allColumns = (await Promise.all(columnPromises)).flat()

      items.push(...allColumns.filter((item, i, arr) => arr.findIndex(x => x.label === item.label) === i))
    }

    if (tablesAndSchemas) {
      const tableItems = tablesAndSchemas.schemas.flatMap(schema =>
        schema.tables.flatMap(tableName => [
          {
            label: tableName,
            kind: languages.CompletionItemKind.Class,
            detail: `table (${schema.name})`,
            sortText: `2${tableName}`,
            insertText: tableName,
          } satisfies ICompletionItem,
          {
            label: `${schema.name}.${tableName}`,
            kind: languages.CompletionItemKind.Class,
            detail: `table (${schema.name})`,
            sortText: `2${schema.name}.${tableName}`,
            insertText: `${schema.name}.${tableName}`,
          } satisfies ICompletionItem,
        ]),
      )

      items.push(...tableItems)
    }

    if (enums) {
      const enumItems = enums.flatMap(enumItem =>
        enumItem.values.map(value => ({
          label: value,
          kind: languages.CompletionItemKind.EnumMember,
          detail: `enum value (${enumItem.schema}.${enumItem.name})`,
          sortText: `3${value}`,
          insertText: value,
        } satisfies ICompletionItem)),
      )

      items.push(...enumItems)
    }

    return [...items, ...keywordItems]
  }
}

export async function connectionAICompletionContext(connection: typeof connections.$inferSelect) {
  const store = connectionStore(connection.id)
  queryClient.prefetchQuery(connectionTablesAndSchemasQuery({ connection, showSystem: store.state.showSystem }))
  queryClient.prefetchQuery(connectionEnumsQuery({ connection }))

  const buildSchemaContext = async (): Promise<string> => {
    const [tablesAndSchemas, enums] = await Promise.all([
      queryClient.ensureQueryData(connectionTablesAndSchemasQuery({ connection, showSystem: store.state.showSystem })),
      queryClient.ensureQueryData(connectionEnumsQuery({ connection })),
    ])

    const contextLines: string[] = []

    for (const schema of tablesAndSchemas.schemas) {
      contextLines.push('', `Schema: ${schema.name}`, '')

      for (const tableName of schema.tables) {
        const columns = await queryClient.ensureQueryData(
          connectionTableColumnsQuery({
            connection,
            schema: schema.name,
            table: tableName,
          }),
        )

        contextLines.push(`  Table: ${tableName}`, '')
        columns.forEach((col) => {
          contextLines.push(`    - ${col.id}: ${col.type} ${col.isNullable ? '(nullable)' : '(not null)'}`)
        })
      }
    }

    if (enums?.length > 0) {
      contextLines.push('', 'Enums:', '')
      enums.forEach((enumItem) => {
        contextLines.push(`  ${enumItem.schema}.${enumItem.name}: [${enumItem.values.join(', ')}]`)
      })
    }

    return contextLines.join('\n')
  }

  return {
    type: connection.type,
    buildSchemaContext,
  }
}
