import type { Edge } from '@xyflow/react'
import type { NodeType } from '~/entities/connection/components'
import type { Column } from '~/entities/connection/components/table/utils'
import type { constraintsType, enumType } from '~/entities/connection/sql'
import type { columnType } from '~/entities/connection/sql/columns'
import dagre from '@dagrejs/dagre'
import { Position } from '@xyflow/react'

export const ENUM_ANCHOR_ID = 'enum_anchor'

export function getEdges({ constraints, columns, enums, schema }: { constraints: typeof constraintsType.infer[], columns: typeof columnType.infer[], enums: typeof enumType.infer[], schema: string }): Edge[] {
  const edges = constraints
    .filter(c => c.type === 'foreignKey' && c.foreignTable && c.foreignColumn && c.table && c.column)
    .map(c => ({
      id: `${c.table}_${c.column}_${c.foreignTable}_${c.foreignColumn}`,
      type: 'custom',
      source: c.table,
      target: c.foreignTable!,
      sourceHandle: c.column!,
      targetHandle: c.foreignColumn!,
    }))

  if (columns && enums && schema) {
    const schemaEnums = enums.filter(e => e.schema === schema)

    columns.forEach((c) => {
      const enumDef = c.enum
        ? schemaEnums.find((e) => {
            if (e.metadata?.table) {
              return e.metadata.table === c.table && e.metadata.column === c.id
            }

            return e.id === c.enum || e.name === c.enum
          })
        : null

      if (enumDef) {
        edges.push({
          id: `${c.table}_${c.id}_${enumDef.id}`,
          type: 'custom',
          source: c.table,
          target: enumDef.id,
          sourceHandle: c.id,
          targetHandle: ENUM_ANCHOR_ID,
        })
      }
    })
  }

  return edges
}

export function applySearchHighlight<TNode extends NodeType>({
  nodes,
  searchQuery,
  tables,
  columns,
}: {
  nodes: TNode[]
  searchQuery: string
  tables: string[]
  columns: typeof columnType.infer[]
}): TNode[] {
  const matchedTables = searchQuery
    ? [...new Set(tables.filter(table => table.toLowerCase().includes(searchQuery)))]
    : []
  const matchedColumns = searchQuery
    ? [...new Set(columns.filter(column => column.id.toLowerCase().includes(searchQuery)).map(column => column.id))]
    : []

  return nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      searchActive: !!searchQuery,
      tableSearchMatched: matchedTables.includes(node.data.table),
      columns: node.data.columns.map(col => ({
        ...col,
        searchMatched: matchedColumns.includes(col.id),
      })),
    },
  }))
}

export function getNodes({
  databaseId,
  schema,
  tables,
  columns,
  edges,
  constraints,
  enums,
}: {
  databaseId: string
  schema: string
  tables: string[]
  columns: typeof columnType.infer[]
  edges: Edge[]
  constraints: typeof constraintsType.infer[]
  enums: typeof enumType.infer[]
}): NodeType[] {
  const schemaEnums = enums.filter(e => e.schema === schema)

  const tableNodes = tables.map((table) => {
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

          const findEnum = (targetEnums: typeof enumType.infer[]) => c.enum
            ? targetEnums.find((e) => {
                if (e.metadata?.table) {
                  return e.metadata.table === c.table && e.metadata.column === c.id
                }
                return e.id === c.enum || e.name === c.enum
              })
            : null

          const enumLabelDef = findEnum(enums)
          const enumNodeDef = findEnum(schemaEnums)

          return {
            id: c.id,
            type: enumLabelDef ? enumLabelDef.name : c.type,
            isEditable: c.isEditable,
            isNullable: c.isNullable,
            foreign: foreign && foreign.foreignSchema && foreign.foreignTable && foreign.foreignColumn
              ? {
                  name: foreign.name,
                  schema: foreign.foreignSchema,
                  table: foreign.foreignTable,
                  column: foreign.foreignColumn,
                }
              : (enumNodeDef
                  ? {
                      name: `enum_${c.id}`,
                      schema: enumNodeDef.schema,
                      table: enumNodeDef.name,
                      column: ENUM_ANCHOR_ID,
                    }
                  : undefined),
            primaryKey: columnConstraints.find(constraint => constraint.type === 'primaryKey')?.name,
            unique: columnConstraints.find(constraint => constraint.type === 'unique')?.name,
          } satisfies Column
        }),
      },
    } satisfies NodeType
  })

  const enumNodes = schemaEnums.map((e) => {
    const referencedTables = tables.filter((table) => {
      const tableColumns = columns.filter(c => c.table === table && c.schema === schema)
      return tableColumns.some((c) => {
        if (e.metadata?.table) {
          return e.metadata.table === c.table && e.metadata.column === c.id
        }
        return e.id === c.enum || e.name === c.enum
      })
    })

    return {
      id: e.id,
      type: 'tableNode',
      position: { x: 0, y: 0 },
      data: {
        schema: e.schema,
        table: e.name,
        referencedTables,
        databaseId,
        edges,
        isEnum: true,
        columns: [
          {
            id: ENUM_ANCHOR_ID,
            type: 'enum',
            isEditable: false,
            isNullable: false,
            primaryKey: 'false',
          },
          ...e.values.map(val => ({
            id: val,
            type: 'value',
            isEditable: false,
            isNullable: false,
          })),
        ] satisfies Column[],
      },
    } satisfies NodeType
  })

  return [...tableNodes, ...enumNodes]
}

export function getVisualizerLayout({
  databaseId,
  schema,
  tables,
  columns,
  constraints,
  enums,
}: {
  databaseId: string
  schema: string
  tables: string[]
  columns: typeof columnType.infer[]
  constraints: typeof constraintsType.infer[]
  enums: typeof enumType.infer[]
}) {
  const edges = getEdges({ constraints, columns, enums, schema }).filter(edge => tables.includes(edge.source) && (tables.includes(edge.target) || enums.some(e => e.id === edge.target)))
  return getLayoutElements(
    getNodes({
      databaseId,
      schema,
      tables,
      columns,
      edges,
      constraints,
      enums,
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
