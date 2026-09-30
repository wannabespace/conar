import type { Positions } from '~/entities/connection/store/stores'

import type { DiagramRelation, DiagramTable } from '../-lib/schema'
import type { RelationEdge } from './relation-edge'
import { handleId } from './row-handles'
import type { TableNode } from './table-node'

// React Flow re-renders every node and edge whose object changed identity, so
// a drag frame must hand back the unmoved ones it already has.
const nodeCache = new WeakMap<DiagramTable, TableNode>()
const edgeCache = new WeakMap<DiagramRelation, RelationEdge>()

export const tableNode = (
  table: DiagramTable,
  position: Positions[string],
  selected: boolean,
  measured: TableNode['measured']
): TableNode => {
  const cached = nodeCache.get(table)
  if (
    cached?.position === position &&
    cached.selected === selected &&
    cached.measured === measured
  ) {
    return cached
  }
  const node: TableNode = {
    data: { table },
    id: table.id,
    measured,
    position,
    selected,
    type: 'table',
  }
  nodeCache.set(table, node)
  return node
}

export const relationEdge = (
  relation: DiagramRelation,
  positions: Positions,
  selected: boolean
): RelationEdge => {
  const sourceX = positions[relation.source.table]?.x ?? 0
  const targetX = positions[relation.target.table]?.x ?? 0
  const forward = sourceX <= targetX
  const sourceHandle = handleId(
    relation.source.column,
    forward ? 'right' : 'left',
    'source'
  )
  const cached = edgeCache.get(relation)
  if (cached?.selected === selected && cached.sourceHandle === sourceHandle) {
    return cached
  }
  const edge: RelationEdge = {
    data: { relation },
    id: relation.id,
    selected,
    source: relation.source.table,
    sourceHandle,
    target: relation.target.table,
    targetHandle: handleId(
      relation.target.column,
      forward ? 'left' : 'right',
      'target'
    ),
    type: 'relation',
  }
  edgeCache.set(relation, edge)
  return edge
}
