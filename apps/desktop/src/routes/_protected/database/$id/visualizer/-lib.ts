import type { Edge } from '@xyflow/react'
import type { NodeType } from '~/entities/connection/components'
import type { Column } from '~/entities/connection/components/table/utils'
import type { constraintsType } from '~/entities/connection/sql'
import type { columnType } from '~/entities/connection/sql/columns'
import dagre from '@dagrejs/dagre'
import { Position } from '@xyflow/react'

export function getEdges({ constraints }: { constraints: typeof constraintsType.infer[] }): Edge[] {
  return constraints
    .filter(c => c.type === 'foreignKey' && c.foreignTable && c.foreignColumn && c.table && c.column)
    .map(c => ({
      id: `${c.table}_${c.column}_${c.foreignTable}_${c.foreignColumn}`,
      type: 'custom',
      source: c.table,
      target: c.foreignTable!,
      sourceHandle: c.column!,
      targetHandle: c.foreignColumn!,
    }))
}

export function getTableSearchState({
  tables,
  query,
}: {
  tables: string[]
  query: string
}) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return {
      isActive: false,
      matchedTables: new Set<string>(),
    }
  }

  return {
    isActive: true,
    matchedTables: new Set(tables.filter(table => table.toLowerCase().includes(normalizedQuery))),
  }
}

export function applySearchHighlight<TNode extends NodeType>({
  nodes,
  isSearchActive,
  matchedTables,
}: {
  nodes: TNode[]
  isSearchActive: boolean
  matchedTables: Set<string>
}): TNode[] {
  return nodes.map((node) => {
    const highlightedNode = { ...node }
    highlightedNode.data = {
      ...highlightedNode.data,
      searchActive: isSearchActive,
      searchMatched: isSearchActive && matchedTables.has(node.data.table),
    }
    return highlightedNode
  })
}

export function getNodes({
  databaseId,
  schema,
  tables,
  columns,
  edges,
  constraints,
}: {
  databaseId: string
  schema: string
  tables: string[]
  columns: typeof columnType.infer[]
  edges: Edge[]
  constraints: typeof constraintsType.infer[]
}): NodeType[] {
  return tables.map((table) => {
    const tableColumns = columns.filter(c => c.table === table && c.schema === schema)
    const tableConstraints = constraints.filter(c => c.table === table && c.schema === schema)
    const tableForeignKeys = tableConstraints.filter(c => c.type === 'foreignKey' && c.table === table && c.schema === schema)

    return {
      id: table,
      type: 'tableNode',
      position: { x: 0, y: 0 },
      data: {
        schema,
        table,
        databaseId,
        edges,
        columns: tableColumns.map((c) => {
          const columnConstraints = tableConstraints.filter(constraint => constraint.column === c.id)
          const foreign = tableForeignKeys.find(foreignKey => foreignKey.column === c.id && foreignKey.schema === schema && foreignKey.table === table)

          return {
            id: c.id,
            type: c.type,
            isEditable: c.isEditable,
            isNullable: c.isNullable,
            foreign: foreign && foreign.foreignSchema && foreign.foreignTable && foreign.foreignColumn
              ? {
                  name: foreign.name,
                  schema: foreign.foreignSchema,
                  table: foreign.foreignTable,
                  column: foreign.foreignColumn,
                }
              : undefined,
            primaryKey: columnConstraints.find(constraint => constraint.type === 'primaryKey')?.name,
            unique: columnConstraints.find(constraint => constraint.type === 'unique')?.name,
          } satisfies Column
        }),
      },
    } satisfies NodeType
  })
}

export function getVisualizerLayout({
  databaseId,
  schema,
  tables,
  columns,
  constraints,
}: {
  databaseId: string
  schema: string
  tables: string[]
  columns: typeof columnType.infer[]
  constraints: typeof constraintsType.infer[]
}) {
  const visibleTables = new Set(tables)
  const edges = getEdges({ constraints }).filter(
    edge => visibleTables.has(edge.source) && visibleTables.has(edge.target),
  )

  return getLayoutElements(
    getNodes({
      databaseId,
      schema,
      tables,
      columns,
      edges,
      constraints,
    }),
    edges,
  )
}

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

const nodeWidth = 264

function getNodeSize(columns: NodeType['data']['columns']) {
  return {
    width: nodeWidth,
    height: (columns.length * 33) + (8 * 2) + 45, // 8 is padding, 45 is header height
  }
}

export function getLayoutElements(nodes: NodeType[], edges: Edge[], direction = 'LR') {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    const { width, height } = getNodeSize(node.data.columns)
    dagreGraph.setNode(node.id, { width, height })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node) => {
    const { width, height } = getNodeSize(node.data.columns)
    const nodeWithPosition = dagreGraph.node(node.id)
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    } satisfies NodeType

    return newNode
  })

  return { nodes: newNodes, edges }
}
