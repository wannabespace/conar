import { cn } from '@tamery/ui/lib/utils'
import type { Edge, EdgeProps } from '@xyflow/react'
import { BaseEdge, getSmoothStepPath, Position } from '@xyflow/react'
import { useSubscription } from 'seitu/react'

import { relationTouches, useDiagram } from '../-lib/context'
import type { DiagramRelation } from '../-lib/schema'

export type RelationEdge = Edge<{ relation: DiagramRelation }, 'relation'>

const MARKER_LENGTH = 14
const MARKER_SPREAD = 5

// Crow's foot fans out at the node edge; a bar stands for "one".
const markerPath = (
  x: number,
  y: number,
  position: Position,
  many: boolean
) => {
  const away = position === Position.Left ? -MARKER_LENGTH : MARKER_LENGTH
  const stem = `M ${x} ${y} L ${x + away} ${y}`
  if (many) {
    return `${stem} M ${x + away} ${y} L ${x} ${y - MARKER_SPREAD} M ${x + away} ${y} L ${x} ${y + MARKER_SPREAD}`
  }
  const bar = x + away / 2
  return `${stem} M ${bar} ${y - MARKER_SPREAD} L ${bar} ${y + MARKER_SPREAD}`
}

const offset = (x: number, position: Position) =>
  position === Position.Left ? x - MARKER_LENGTH : x + MARKER_LENGTH

export const RelationEdgeView = ({
  data,
  selected,
  sourcePosition,
  sourceX,
  sourceY,
  targetPosition,
  targetX,
  targetY,
}: EdgeProps<RelationEdge>) => {
  const { selectedId, view } = useDiagram()
  const relation = data?.relation
  const hovered = useSubscription(view, {
    selector: ({ hoveredRelationId, hoveredTableId }) =>
      relation !== undefined &&
      (relation.id === hoveredRelationId ||
        (hoveredTableId !== null && relationTouches(relation, hoveredTableId))),
  })
  const highlighted =
    !!selected ||
    hovered ||
    (relation !== undefined &&
      selectedId !== null &&
      relationTouches(relation, selectedId))
  const [path] = getSmoothStepPath({
    borderRadius: 12,
    sourcePosition,
    sourceX: offset(sourceX, sourcePosition),
    sourceY,
    targetPosition,
    targetX: offset(targetX, targetPosition),
    targetY,
  })
  const stroke = cn(
    'fill-none stroke-[1.5] transition-[stroke,stroke-width]',
    relation?.state === 'added' && 'stroke-success [stroke-dasharray:4_4]',
    relation?.state === 'dropped' &&
      'stroke-destructive opacity-60 [stroke-dasharray:4_4]',
    !relation?.state &&
      (highlighted ? 'stroke-primary' : 'stroke-foreground/30'),
    highlighted && 'stroke-2'
  )

  return (
    <>
      <BaseEdge path={path} className={stroke} interactionWidth={16} />
      <path
        d={`${markerPath(sourceX, sourceY, sourcePosition, relation?.many ?? true)} ${markerPath(targetX, targetY, targetPosition, false)}`}
        className={cn(stroke, 'pointer-events-none')}
      />
    </>
  )
}
