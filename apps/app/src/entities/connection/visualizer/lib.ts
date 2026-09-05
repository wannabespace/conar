import dagre from '@dagrejs/dagre'
import type { Edge } from '@xyflow/react'
import { Position } from '@xyflow/react'

import type { NodeType } from '~/entities/connection/components'
import type { Column } from '~/entities/connection/components/table/cell'
import { getColumnUiType } from '~/entities/connection/components/table/cell'
import type { constraintsType } from '~/entities/connection/queries'
import type { columnType } from '~/entities/connection/queries/columns'

type ForeignKeyConstraint = typeof constraintsType.infer & {
  column: string
  foreignColumn: string
  foreignTable: string
  table: string
}

const isForeignKeyConstraint = (
  constraint: typeof constraintsType.infer
): constraint is ForeignKeyConstraint =>
  constraint.type === 'foreignKey' &&
  !!constraint.foreignTable &&
  !!constraint.foreignColumn &&
  !!constraint.table &&
  !!constraint.column

const getEdges = ({
  constraints,
}: {
  constraints: (typeof constraintsType.infer)[]
}): Edge[] =>
  constraints.filter(isForeignKeyConstraint).map((c) => ({
    id: `${c.table}_${c.column}_${c.foreignTable}_${c.foreignColumn}`,
    source: c.table,
    sourceHandle: c.column,
    target: c.foreignTable,
    targetHandle: c.foreignColumn,
    type: 'custom',
  }))

export const applySearchHighlight = <TNode extends NodeType>({
  nodes,
  searchQuery,
  tables,
  columns,
}: {
  nodes: TNode[]
  searchQuery: string
  tables: string[]
  columns: (typeof columnType.infer)[]
}): TNode[] => {
  const matchedTables = searchQuery
    ? [
        ...new Set(
          tables.filter((table) => table.toLowerCase().includes(searchQuery))
        ),
      ]
    : []
  const matchedColumns = searchQuery
    ? [
        ...new Set(
          columns
            .filter((column) => column.id.toLowerCase().includes(searchQuery))
            .map((column) => column.id)
        ),
      ]
    : []

  return nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      columns: node.data.columns.map((col) => ({
        ...col,
        searchMatched: matchedColumns.includes(col.id),
      })),
      searchActive: !!searchQuery,
      tableSearchMatched: matchedTables.includes(node.data.table),
    },
  }))
}

const getNodes = ({
  resourceId,
  schema,
  tables,
  columns,
  edges,
  constraints,
}: {
  resourceId: string
  schema: string
  tables: string[]
  columns: (typeof columnType.infer)[]
  edges: Edge[]
  constraints: (typeof constraintsType.infer)[]
}): NodeType[] =>
  tables.map((table) => {
    const tableColumns = columns.filter(
      (c) => c.table === table && c.schema === schema
    )
    const tableConstraints = constraints.filter(
      (c) => c.table === table && c.schema === schema
    )
    const tableForeignKeys = tableConstraints.filter(
      (c) => c.type === 'foreignKey' && c.table === table && c.schema === schema
    )

    return {
      data: {
        columns: tableColumns.map((c) => {
          const columnConstraints = tableConstraints.filter(
            (constraint) => constraint.column === c.id
          )
          const foreign = tableForeignKeys.find(
            (foreignKey) =>
              foreignKey.column === c.id &&
              foreignKey.schema === schema &&
              foreignKey.table === table
          )

          return {
            ...c,
            foreign:
              foreign &&
              foreign.foreignSchema &&
              foreign.foreignTable &&
              foreign.foreignColumn
                ? {
                    column: foreign.foreignColumn,
                    name: foreign.name,
                    schema: foreign.foreignSchema,
                    table: foreign.foreignTable,
                  }
                : undefined,
            primaryKey: columnConstraints.find(
              (constraint) => constraint.type === 'primaryKey'
            )?.name,
            uiType: getColumnUiType(c),
            unique: columnConstraints.find(
              (constraint) => constraint.type === 'unique'
            )?.name,
          } satisfies Column
        }),
        edges,
        resourceId,
        schema,
        table,
      },
      id: table,
      position: { x: 0, y: 0 },
      type: 'tableNode',
    } satisfies NodeType
  })

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

const nodeWidth = 264
const columnRowHeight = 33
const nodeVerticalPadding = 8 * 2
const nodeHeaderHeight = 45

const getNodeSize = (columns: NodeType['data']['columns']) => ({
  height:
    columns.length * columnRowHeight + nodeVerticalPadding + nodeHeaderHeight,
  width: nodeWidth,
})

const getLayoutElements = (
  nodes: NodeType[],
  edges: Edge[],
  direction = 'LR'
) => {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction })

  for (const node of nodes) {
    const { width, height } = getNodeSize(node.data.columns)
    dagreGraph.setNode(node.id, { height, width })
  }

  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target)
  }

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node) => {
    const { width, height } = getNodeSize(node.data.columns)
    const nodeWithPosition = dagreGraph.node(node.id)
    const newNode = {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
    } satisfies NodeType

    return newNode
  })

  return { edges, nodes: newNodes }
}

export const getVisualizerLayout = ({
  resourceId,
  schema,
  tables,
  columns,
  constraints,
}: {
  resourceId: string
  schema: string
  tables: string[]
  columns: (typeof columnType.infer)[]
  constraints: (typeof constraintsType.infer)[]
}) => {
  const edges = getEdges({ constraints }).filter(
    (edge) => tables.includes(edge.source) && tables.includes(edge.target)
  )
  return getLayoutElements(
    getNodes({
      columns,
      constraints,
      edges,
      resourceId,
      schema,
      tables,
    }),
    edges
  )
}
