import { memoize } from 'memoza'
import { createContext, use } from 'react'
import { createStore } from 'seitu'

import type {
  Diagram,
  DiagramColumn,
  DiagramRelation,
  DiagramTable,
} from './schema'

export interface DiagramGates {
  cascade: boolean
  ddlRollback: boolean
  dropForeignKeys: boolean
  foreignKeys: boolean
  indexes: boolean
  policies: boolean
  renameColumns: boolean
  schemas: boolean
  triggers: boolean
}

export interface DiagramActions {
  addColumn: (table: DiagramTable) => void
  createTable: () => void
  dropColumn: (table: DiagramTable, column: DiagramColumn) => void
  dropRelation: (relation: DiagramRelation) => void
  dropTable: (table: DiagramTable, cascade: boolean) => void
  editColumn: (table: DiagramTable, column: DiagramColumn) => void
  focusRelation: (relation: DiagramRelation) => void
  openTable: (table: DiagramTable, newWindow?: boolean) => void
  renameTable: (table: DiagramTable) => void
  restoreTable: (table: DiagramTable) => void
  select: (tableId: string | null) => void
  toggleNullable: (table: DiagramTable, column: DiagramColumn) => void
}

// Hover and zoom change on every pointer move, so they live in a store each
// card and edge reads through its own selector instead of in React context,
// which would re-render every card on the canvas per move.
export interface DiagramView {
  compact: boolean
  hoveredRelationId: string | null
  hoveredTableId: string | null
}

export const diagramViewStore = memoize((_resourceId: string) =>
  createStore<DiagramView>({
    compact: false,
    hoveredRelationId: null,
    hoveredTableId: null,
  })
)

type DiagramViewStore = ReturnType<typeof diagramViewStore>

// Below this zoom column text is unreadable, so cards drop their rows and
// scale the table name up instead.
export const COMPACT_ZOOM = 0.5

export interface DiagramContextValue {
  actions: DiagramActions
  can: DiagramGates
  diagram: Diagram
  search: string
  selectedId: string | null
  view: DiagramViewStore
}

export const DiagramContext = createContext<DiagramContextValue | null>(null)

export const useDiagram = () => {
  const value = use(DiagramContext)
  if (!value) {
    throw new Error('DiagramContext is not provided')
  }
  return value
}

export const relationTouches = (relation: DiagramRelation, tableId: string) =>
  relation.source.table === tableId || relation.target.table === tableId

export const tableMatches = (table: DiagramTable, search: string) =>
  table.name.toLowerCase().includes(search) ||
  table.columns.some((column) => column.name.toLowerCase().includes(search))
