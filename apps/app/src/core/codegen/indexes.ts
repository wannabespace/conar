import type { Index, SchemaParams } from './types'
import { isSingleColumnConstraint } from './utils'

interface GroupedIndex extends Pick<
  Index,
  'type' | 'name' | 'isUnique' | 'custom' | 'definition'
> {
  columns: string[]
  keys: ({ column: string } | { expression: string })[]
}

export const explicitIndexes = ({
  columns,
  indexes = [],
  schema,
  table,
}: Omit<SchemaParams, 'dialect'>) => {
  const grouped = new Map<string, GroupedIndex>()

  for (const idx of indexes) {
    if (idx.table !== table || idx.schema !== schema || idx.isPrimary) {
      continue
    }

    const entry = grouped.get(idx.name) ?? {
      columns: [],
      custom: idx.custom,
      definition: idx.definition,
      isUnique: idx.isUnique,
      keys: [],
      name: idx.name,
      type: idx.type,
    }
    grouped.set(idx.name, entry)
    if (idx.column) {
      entry.columns.push(idx.column)
      entry.keys.push({ column: idx.column })
    } else if (idx.customExpression) {
      entry.keys.push({ expression: idx.customExpression })
    }
  }

  return [...grouped.values()].filter(
    (idx) =>
      idx.keys.length > 0 &&
      !(
        idx.isUnique &&
        idx.columns.length === 1 &&
        columns.some(
          (c) =>
            c.id === idx.columns[0] &&
            isSingleColumnConstraint(c, columns, 'unique')
        )
      )
  )
}
