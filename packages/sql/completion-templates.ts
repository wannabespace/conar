import type { SqlCatalog } from './catalog'
import { findTable } from './catalog'
import type { CompletionContext } from './completion-context'
import type { CompletionItem } from './completion-items'
import { orderedItems, quoteIfNeeded } from './completion-items'
import type { StatementScope, TableRef } from './scope'

const singular = (name: string) => {
  if (name.endsWith('ies')) {
    return `${name.slice(0, -3)}y`
  }
  return name.endsWith('s') ? name.slice(0, -1) : name
}

const joinConditionItems = (
  scope: StatementScope,
  catalog: SqlCatalog
): CompletionItem[] => {
  const joined = scope.tables.at(-1)
  if (!joined || scope.tables.length < 2) {
    return []
  }
  const pairs: string[] = []
  const sides = (ref: TableRef) => {
    const table = findTable(catalog, ref.name, ref.schema)
    return {
      columns: table?.columns?.map((column) => column.name.toLowerCase()) ?? [],
      prefix: ref.alias ?? ref.name,
      table,
    }
  }
  const right = sides(joined)
  for (const ref of scope.tables.slice(0, -1)) {
    const left = sides(ref)
    if (!left.table || !right.table) {
      continue
    }
    for (const [from, to] of [
      [left, right],
      [right, left],
    ] as const) {
      const key = `${singular(to.table?.name ?? '').toLowerCase()}_id`
      if (from.columns.includes(key) && to.columns.includes('id')) {
        pairs.push(`${from.prefix}.${key} = ${to.prefix}.id`)
      }
    }
  }
  return orderedItems(
    pairs.map((label) => ({ label })),
    'column'
  )
}

const insertTemplate = (
  scope: StatementScope,
  catalog: SqlCatalog
): CompletionItem[] => {
  const target = scope.tables.at(-1)
  const table = target && findTable(catalog, target.name, target.schema)
  const columns = table?.columns?.filter((column) => column.name !== 'id')
  if (!columns || columns.length === 0) {
    return []
  }
  const names = columns.map((column) => column.name)
  const inserted = names.map((name) => quoteIfNeeded(catalog, name))
  return orderedItems(
    [
      {
        detail: names.join(', '),
        insertText: `(${inserted.join(', ')})\nVALUES (${names.map((name, index) => `\${${index + 1}:${name}}`).join(', ')})`,
        label: '(columns…) VALUES (…)',
        snippet: true,
      },
    ],
    'keyword'
  )
}

export const templateItems = (
  context: CompletionContext,
  catalog: SqlCatalog
): CompletionItem[] => {
  const { scope, selectedColumns, template } = context
  if (template === 'select') {
    const [only] = scope.tables
    const table =
      only && scope.tables.length === 1
        ? findTable(catalog, only.name, only.schema)
        : undefined
    const all =
      table?.columns?.map((column) => quoteIfNeeded(catalog, column.name)) ?? []
    return orderedItems(
      [
        { label: '*' },
        ...(all.length > 0
          ? [
              {
                detail: 'all columns',
                insertText: all.join(', '),
                label: all.join(', '),
              },
            ]
          : []),
      ],
      'column'
    )
  }
  if (template === 'group-by' && selectedColumns.length > 0) {
    return orderedItems(
      [
        ...(selectedColumns.length > 1
          ? [
              {
                detail: 'every selected column',
                label: selectedColumns.join(', '),
              },
            ]
          : []),
        ...selectedColumns.map((label) => ({ label })),
      ],
      'column'
    )
  }
  if (template === 'join-on') {
    return joinConditionItems(scope, catalog)
  }
  if (template === 'into') {
    return insertTemplate(scope, catalog)
  }
  return []
}
