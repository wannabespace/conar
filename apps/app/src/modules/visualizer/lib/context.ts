import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { memoize } from 'memoza'
import { createContext, use } from 'react'
import { createStore } from 'seitu'

import {
  capabilitiesOf,
  sectionAvailable,
  sectionCapabilitiesOf,
} from '~/core/catalog/capabilities'

import type {
  Diagram,
  DiagramColumn,
  DiagramRelation,
  DiagramTable,
} from './schema'

export const gatesOf = (connectionType: ConnectionType) => {
  const capabilities = capabilitiesOf(connectionType)
  const constraints = sectionCapabilitiesOf('constraints', connectionType)

  return {
    cascade: capabilities.cascade,
    ddlRollback: capabilities.ddlRollback,
    dropForeignKeys: !!constraints.drop,
    foreignKeys:
      capabilities.constraintKinds.includes('foreignKey') &&
      !!constraints.create,
    indexes: sectionAvailable('indexes', connectionType),
    policies: sectionAvailable('policies', connectionType),
    renameColumns: capabilities.renameColumns,
    schemas: capabilities.schemas,
    triggers: sectionAvailable('triggers', connectionType),
  }
}

export type DiagramGates = ReturnType<typeof gatesOf>

export interface DiagramActions {
  addColumn: (table: DiagramTable) => void
  createTable: () => void
  dropColumn: (table: DiagramTable, column: DiagramColumn) => void
  dropRelation: (relation: DiagramRelation) => void
  dropTable: (table: DiagramTable, cascade: boolean) => void
  editColumn: (table: DiagramTable, column: DiagramColumn) => void
  focusRelation: (relation: DiagramRelation) => void
  linkColumns: (link: {
    column: string
    foreignColumn: string
    foreignTable: string
    table: string
  }) => void
  openTable: (table: DiagramTable, newWindow?: boolean) => void
  renameTable: (table: DiagramTable) => void
  restoreTable: (table: DiagramTable) => void
  select: (tableId: string | null) => void
  toggleNullable: (table: DiagramTable, column: DiagramColumn) => void
}

// Hover changes on every pointer move, so it lives in a store each card and
// edge reads through its own selector instead of in React context, which would
// re-render every card on the canvas per move.
interface DiagramView {
  hoveredRelationIds: string[]
  hoveredTableId: string | null
}

export const diagramViewStore = memoize((_resourceId: string) =>
  createStore<DiagramView>({
    hoveredRelationIds: [],
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
