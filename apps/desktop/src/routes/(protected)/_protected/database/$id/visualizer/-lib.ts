import type { Edge } from '@xyflow/react'
import type { Column, constraintsType, NodeType } from '~/entities/database'
import type { columnType } from '~/entities/database/sql/columns'
import dagre from '@dagrejs/dagre'
import { Position } from '@xyflow/react'

export function getEdges({ constraints }: { constraints: typeof constraintsType.infer[] }): Edge[] {
  return constraints
    .filter(c => c.type === 'foreignKey' && c.usageTable && c.usageColumn && c.table && c.column)
    .map(c => ({
      id: `${c.table}_${c.column}_${c.usageTable}_${c.usageColumn}`,
      type: 'custom',
      source: c.table,
      target: c.usageTable!,
      sourceHandle: c.column!,
      targetHandle: c.usageColumn!,
    }))
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
            foreign: foreign && foreign.usageSchema && foreign.usageTable && foreign.usageColumn
              ? {
                  name: foreign.name,
                  schema: foreign.usageSchema,
                  table: foreign.usageTable,
                  column: foreign.usageColumn,
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

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

const nodeWidth = 264

function getNodeSize(columns: NodeType['data']['columns']) {
  return {
    width: nodeWidth,
    height: (columns.length * 33) + (8 * 2) + 45, // 8 is padding, 45 is header height
  }
}

export function getLayoutElements(nodes: NodeType[], edges: Edge[], direction = 'TB') {
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
