import type { SqlCatalog, SqlColumn, SqlTable } from './catalog'
import { findColumn, findTable } from './catalog'
import type { ColumnRef } from './cursor'
import type { DialectSpec } from './dialect'
import type { StatementScope } from './scope'

export type CompletionKind =
  | 'column'
  | 'enum'
  | 'function'
  | 'keyword'
  | 'operator'
  | 'schema'
  | 'table'
  | 'value'
  | 'view'

export interface CompletionItem {
  label: string
  kind: CompletionKind
  insertText: string
  detail?: string
  sortText: string
  /** `insertText` uses `${1:placeholder}` tab stops. */
  snippet?: true
}

const KEYWORD_PRIORITY = [
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'LEFT',
  'INNER',
  'ON',
  'GROUP',
  'ORDER',
  'BY',
  'LIMIT',
  'AND',
  'OR',
  'AS',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'WITH',
  'CREATE',
  'ALTER',
  'DROP',
]

export const tableForQualifier = (
  scope: StatementScope,
  catalog: SqlCatalog,
  qualifier: string
) => {
  const ref = scope.tables.find(
    (table) =>
      table.alias?.toLowerCase() === qualifier.toLowerCase() ||
      table.name.toLowerCase() === qualifier.toLowerCase()
  )
  return ref ? findTable(catalog, ref.name, ref.schema) : undefined
}

export const resolveComparedColumn = (
  comparedColumn: ColumnRef | null,
  scope: StatementScope,
  catalog: SqlCatalog
): { column: SqlColumn; table: SqlTable } | null => {
  if (!comparedColumn) {
    return null
  }
  const tables = comparedColumn.qualifier
    ? [tableForQualifier(scope, catalog, comparedColumn.qualifier)]
    : scope.tables.map((ref) => findTable(catalog, ref.name, ref.schema))
  for (const table of tables) {
    const column = table && findColumn(catalog, table, comparedColumn.name)
    if (table && column) {
      return { column, table }
    }
  }
  return null
}

const PLAIN_NAME = /^[a-z_][a-z\d_$]*$/u

// A catalog that matches names exactly folds unquoted ones to lowercase, so any other spelling is inserted quoted.
export const quoteIfNeeded = (catalog: SqlCatalog, name: string) =>
  catalog.exactNames && !PLAIN_NAME.test(name)
    ? `"${name.replaceAll('"', '""')}"`
    : name

export const columnItems = (
  catalog: SqlCatalog,
  table: SqlTable,
  { detail = '', qualifier = '' }: { detail?: string; qualifier?: string } = {}
): CompletionItem[] =>
  (table.columns ?? []).map((column) => {
    const name = qualifier ? `${qualifier}.${column.name}` : column.name
    const inserted = quoteIfNeeded(catalog, column.name)
    return {
      detail: `${detail}${column.type}${column.nullable ? '' : ' not null'}`,
      insertText: qualifier
        ? `${quoteIfNeeded(catalog, qualifier)}.${inserted}`
        : inserted,
      kind: 'column',
      label: name,
      sortText: `1${name}`,
    }
  })

export const tableItems = (catalog: SqlCatalog): CompletionItem[] =>
  catalog.schemas.flatMap((schema) =>
    schema.tables.map((table) => {
      const inDefault = schema.name === catalog.defaultSchema
      const qualified = inDefault ? table.name : `${schema.name}.${table.name}`
      const inserted = quoteIfNeeded(catalog, table.name)
      return {
        detail: `${table.kind} · ${schema.name}`,
        insertText: inDefault
          ? inserted
          : `${quoteIfNeeded(catalog, schema.name)}.${inserted}`,
        kind: table.kind === 'view' ? 'view' : 'table',
        label: qualified,
        sortText: `2${qualified}`,
      }
    })
  )

export const keywordItems = (dialect: DialectSpec): CompletionItem[] =>
  [...dialect.keywords].map((keyword) => {
    const priority = KEYWORD_PRIORITY.indexOf(keyword)
    return {
      insertText: keyword,
      kind: 'keyword',
      label: keyword,
      sortText: `4${(priority === -1 ? 99 : priority).toString().padStart(2, '0')}${keyword}`,
    }
  })

export const functionItems = (dialect: DialectSpec): CompletionItem[] =>
  [...dialect.functions].map((name) => ({
    insertText: `${name}($1)`,
    kind: 'function',
    label: name,
    snippet: true,
    sortText: `5${name}`,
  }))

export const orderedItems = (
  items: {
    label: string
    insertText?: string
    detail?: string
    kind?: CompletionKind
    snippet?: true
  }[],
  kind: CompletionKind,
  rank = '0'
): CompletionItem[] =>
  items.map((item, index) => ({
    detail: item.detail,
    insertText: item.insertText ?? item.label,
    kind: item.kind ?? kind,
    label: item.label,
    snippet: item.snippet,
    sortText: `${rank}${index.toString().padStart(2, '0')}`,
  }))

export const scopeColumnItems = (
  scope: StatementScope,
  catalog: SqlCatalog
): CompletionItem[] => {
  const known = scope.tables.flatMap((ref) => {
    const table = findTable(catalog, ref.name, ref.schema)
    return table ? [{ qualifier: ref.alias ?? table.name, table }] : []
  })
  const qualify = known.length > 1
  const seen = new Set<string>()
  return known.flatMap(({ qualifier, table }) =>
    columnItems(catalog, table, {
      detail: qualify ? '' : `${qualifier} · `,
      qualifier: qualify ? qualifier : '',
    }).filter((item) => {
      if (seen.has(item.label.toLowerCase())) {
        return false
      }
      seen.add(item.label.toLowerCase())
      return true
    })
  )
}
