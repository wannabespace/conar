import type { columnType } from '@conar/shared/sql/columns'
import type { constraintsType } from '@conar/shared/sql/constraints'
import type { foreignKeysType } from '@conar/shared/sql/foreign-keys'
import type { Edge } from '@xyflow/react'
import type { NodeType } from '~/entities/database'
import type { Column } from '~/entities/database/table'
import dagre from '@dagrejs/dagre'
import { Position } from '@xyflow/react'

export function getEdges({ foreignKeys }: { foreignKeys: typeof foreignKeysType.infer[] }): Edge[] {
  return foreignKeys.map(fk => ({
    id: `${fk.table}_${fk.column}_${fk.foreignTable}_${fk.foreignColumn}`,
    type: 'custom',
    source: fk.table,
    target: fk.foreignTable,
    sourceHandle: fk.column,
    targetHandle: fk.foreignColumn,
  }))
}

export function getNodes({
  databaseId,
  schema,
  tables,
  columns,
  edges,
  foreignKeys,
  constraints,
}: {
  databaseId: string
  schema: string
  tables: string[]
  columns: typeof columnType.infer[]
  edges: Edge[]
  foreignKeys: typeof foreignKeysType.infer[]
  constraints: typeof constraintsType.infer[]
}): NodeType[] {
  return tables.map((table) => {
    const tableColumns = columns.filter(c => c.table === table && c.schema === schema)
    const tableConstraints = constraints.filter(c => c.table === table && c.schema === schema)
    const tableForeignKeys = foreignKeys.filter(fk => fk.table === table && fk.schema === schema)

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
            foreign: foreign
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

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

const nodeWidth = 264

function getNodeSize(columns: NodeType['data']['columns']) {
  return {
    width: nodeWidth,
    height: (columns.length * 33) + (8 * 2) + 45, // 8 is padding, 45 is header height
  }
}

export function getLayoutedElements(nodes: NodeType[], edges: Edge[], direction = 'TB') {
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
