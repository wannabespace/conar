import type { constraintsType } from '~/entities/connection/queries/constraints/list'
import type { DiagramDraft } from '~/entities/connection/queries/diagram/shape'
import type { indexesType } from '~/entities/connection/queries/indexes/list'
import type { policyType } from '~/entities/connection/queries/policies/list'
import type { columnType } from '~/entities/connection/queries/tables/columns'
import type { triggersType } from '~/entities/connection/queries/triggers/list'

export type TableKind = 'table' | 'view' | 'materialized view'

export type DraftState = 'added' | 'changed' | 'dropped'

export interface DiagramColumn {
  // Original name: the handle id and the key every draft on it carries.
  id: string
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  foreign: boolean
  state?: DraftState
}

export interface DiagramTable {
  id: string
  schema: string
  // Original name: the key every draft on it carries.
  table: string
  name: string
  kind: TableKind
  columns: DiagramColumn[]
  counts: { indexes: number; policies: number; triggers: number }
  state?: DraftState
}

export interface DiagramRelation {
  id: string
  name: string
  source: { column: string; table: string }
  target: { column: string; table: string }
  many: boolean
  state?: Exclude<DraftState, 'changed'>
}

export interface Diagram {
  relations: DiagramRelation[]
  tables: DiagramTable[]
}

export const tableNodeId = (schema: string, table: string) =>
  `${schema}.${table}`

const singleColumnKeys = (
  constraints: (typeof constraintsType.infer)[],
  kind: 'primaryKey' | 'unique'
) => {
  const byName = Map.groupBy(
    constraints.filter((c) => c.type === kind),
    (c) => `${c.table}.${c.name}`
  )
  return new Set(
    [...byName.values()]
      .filter((group) => group.length === 1)
      .map(([c]) => `${c?.table}.${c?.column}`)
  )
}

export const buildDiagram = ({
  columns,
  constraints,
  drafts,
  indexes,
  policies,
  schema,
  tables,
  triggers,
}: {
  columns: (typeof columnType.infer)[]
  constraints: (typeof constraintsType.infer)[]
  drafts: DiagramDraft[]
  indexes: (typeof indexesType.infer)[]
  policies: (typeof policyType.infer)[]
  schema: string
  tables: { schema: string; table: string; type: TableKind }[]
  triggers: (typeof triggersType.infer)[]
}): Diagram => {
  const inSchema = <T extends { schema: string }>(items: T[]) =>
    items.filter((item) => item.schema === schema)
  const schemaDrafts = inSchema(drafts)
  const schemaConstraints = inSchema(constraints)
  const primaryKeys = new Set(
    schemaConstraints
      .filter((c) => c.type === 'primaryKey')
      .map((c) => `${c.table}.${c.column}`)
  )
  const uniques = singleColumnKeys(schemaConstraints, 'unique')
  const foreignKeys = schemaConstraints.filter(
    (c) =>
      c.type === 'foreignKey' &&
      c.column &&
      c.foreignTable &&
      c.foreignColumn &&
      (!c.foreignSchema || c.foreignSchema === schema)
  )
  const foreignColumns = new Set(
    foreignKeys.map((c) => `${c.table}.${c.column}`)
  )
  const countBy = <T extends { schema: string; table: string }>(items: T[]) =>
    Map.groupBy(inSchema(items), (item) => item.table)
  const indexCounts = countBy(indexes.filter((index) => !index.constraintOwned))
  const triggerCounts = countBy(triggers)
  const policyCounts = countBy(policies)
  const draftsByTable = Map.groupBy(schemaDrafts, (draft) => draft.table)
  const columnsByTable = Map.groupBy(inSchema(columns), (c) => c.table)
  const noItems: never[] = []

  const existing = inSchema(tables).map((entry): DiagramTable => {
    const tableDrafts = draftsByTable.get(entry.table) ?? noItems
    const rename = tableDrafts.find((d) => d.kind === 'renameTable')
    const dropped = tableDrafts.some((d) => d.kind === 'dropTable')
    const baseColumns = (columnsByTable.get(entry.table) ?? noItems).map(
      (column): DiagramColumn => {
        const key = `${entry.table}.${column.id}`
        const columnDrafts = tableDrafts.filter(
          (d) =>
            (d.kind === 'renameColumn' ||
              d.kind === 'alterColumn' ||
              d.kind === 'dropColumn') &&
            d.column === column.id
        )
        const renamed = columnDrafts.find((d) => d.kind === 'renameColumn')
        const altered = columnDrafts.find((d) => d.kind === 'alterColumn')
        const columnDropped = columnDrafts.some((d) => d.kind === 'dropColumn')
        let state: DraftState | undefined
        if (columnDropped) {
          state = 'dropped'
        } else if (renamed || altered) {
          state = 'changed'
        }

        return {
          foreign: foreignColumns.has(key),
          id: column.id,
          name: renamed ? renamed.newName : column.id,
          nullable: altered ? altered.nullable : column.isNullable,
          primaryKey: primaryKeys.has(key),
          state,
          type: altered ? altered.type : column.typeLabel,
          unique: uniques.has(key),
        }
      }
    )
    const addedColumns = tableDrafts
      .filter((d) => d.kind === 'addColumn')
      .map(({ column }): DiagramColumn => ({
        foreign: false,
        id: column.name,
        name: column.name,
        nullable: column.nullable,
        primaryKey: column.primaryKey,
        state: 'added',
        type: column.type,
        unique: false,
      }))
    let state: DraftState | undefined
    if (dropped) {
      state = 'dropped'
    } else if (rename) {
      state = 'changed'
    }

    return {
      columns: [...baseColumns, ...addedColumns],
      counts: {
        indexes: indexCounts.get(entry.table)?.length ?? 0,
        policies: policyCounts.get(entry.table)?.length ?? 0,
        triggers: triggerCounts.get(entry.table)?.length ?? 0,
      },
      id: tableNodeId(schema, entry.table),
      kind: entry.type,
      name: rename ? rename.newName : entry.table,
      schema,
      state,
      table: entry.table,
    }
  })

  const created = schemaDrafts
    .filter((d) => d.kind === 'createTable')
    .map((draft): DiagramTable => ({
      columns: draft.columns.map((column) => ({
        foreign: false,
        id: column.name,
        name: column.name,
        nullable: column.nullable,
        primaryKey: column.primaryKey,
        state: 'added',
        type: column.type,
        unique: false,
      })),
      counts: { indexes: 0, policies: 0, triggers: 0 },
      id: tableNodeId(schema, draft.table),
      kind: 'table',
      name: draft.table,
      schema,
      state: 'added',
      table: draft.table,
    }))

  const allTables = [...existing, ...created]
  const nodeIds = new Set(allTables.map((table) => table.id))
  const isMany = (table: string, column: string) =>
    !(
      primaryKeys.has(`${table}.${column}`) || uniques.has(`${table}.${column}`)
    )

  const relations: DiagramRelation[] = [
    ...foreignKeys.map((c) => ({
      id: `${c.table}.${c.name}`,
      many: isMany(c.table, c.column ?? ''),
      name: c.name,
      source: { column: c.column ?? '', table: tableNodeId(schema, c.table) },
      state: schemaDrafts.some(
        (d) =>
          d.kind === 'dropForeignKey' &&
          d.table === c.table &&
          d.name === c.name
      )
        ? ('dropped' as const)
        : undefined,
      target: {
        column: c.foreignColumn ?? '',
        table: tableNodeId(schema, c.foreignTable ?? ''),
      },
    })),
    ...schemaDrafts
      .filter((d) => d.kind === 'addForeignKey')
      .map((d) => ({
        id: `${d.table}.${d.name}`,
        many: isMany(d.table, d.columns[0] ?? ''),
        name: d.name,
        source: {
          column: d.columns[0] ?? '',
          table: tableNodeId(schema, d.table),
        },
        state: 'added' as const,
        target: {
          column: d.foreignColumns[0] ?? '',
          table: tableNodeId(d.foreignSchema, d.foreignTable),
        },
      })),
  ].filter(
    (relation) =>
      nodeIds.has(relation.source.table) && nodeIds.has(relation.target.table)
  )

  return { relations, tables: allTables }
}
