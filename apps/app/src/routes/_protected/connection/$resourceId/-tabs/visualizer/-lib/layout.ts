import dagre from '@dagrejs/dagre'

import type { Diagram, DiagramTable } from './schema'

export const NODE_WIDTH = 256
const NODE_HEADER_HEIGHT = 32
const NODE_ROW_HEIGHT = 28
const NODE_BODY_PADDING = 8
const RANK_GAP = 96
const NODE_GAP = 32

export type Positions = Record<string, { x: number; y: number }>

const nodeHeight = (table: DiagramTable) =>
  NODE_HEADER_HEIGHT +
  NODE_BODY_PADDING +
  table.columns.length * NODE_ROW_HEIGHT

const layoutConnected = (
  tables: DiagramTable[],
  relations: Diagram['relations']
) => {
  const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ nodesep: NODE_GAP, rankdir: 'LR', ranksep: RANK_GAP })

  for (const table of tables) {
    graph.setNode(table.id, { height: nodeHeight(table), width: NODE_WIDTH })
  }
  // Referenced table left of the tables pointing at it: a schema reads root-first.
  for (const relation of relations) {
    graph.setEdge(relation.target.table, relation.source.table)
  }

  dagre.layout(graph)

  const { height = 0, width = 0 } = graph.graph()
  const positions: Positions = Object.fromEntries(
    tables.map((table) => {
      const { x, y } = graph.node(table.id)
      return [table.id, { x: x - NODE_WIDTH / 2, y: y - nodeHeight(table) / 2 }]
    })
  )

  return { height, positions, width }
}

// Dagre stacks every unlinked table into one column beside the graph, so
// standalone tables get a grid under it instead.
export const layoutDiagram = ({ relations, tables }: Diagram): Positions => {
  const linked = new Set(
    relations.flatMap((relation) => [
      relation.source.table,
      relation.target.table,
    ])
  )
  const connected = layoutConnected(
    tables.filter((table) => linked.has(table.id)),
    relations
  )
  const standalone = tables.filter((table) => !linked.has(table.id))
  const columns = Math.max(
    1,
    linked.size
      ? Math.floor((connected.width + NODE_GAP) / (NODE_WIDTH + NODE_GAP))
      : Math.ceil(Math.sqrt(standalone.length))
  )
  const positions = { ...connected.positions }
  let rowTop = linked.size ? connected.height + RANK_GAP : 0

  for (let start = 0; start < standalone.length; start += columns) {
    const row = standalone.slice(start, start + columns)
    for (const [index, table] of row.entries()) {
      positions[table.id] = { x: index * (NODE_WIDTH + NODE_GAP), y: rowTop }
    }
    rowTop += Math.max(...row.map(nodeHeight)) + NODE_GAP
  }

  return positions
}
