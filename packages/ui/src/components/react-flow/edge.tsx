import type {
  EdgeProps,
} from '@xyflow/react'
import {
  BaseEdge,
  getSmoothStepPath,
  Position,
} from '@xyflow/react'

export function ReactFlowEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition || Position.Bottom,
    targetX,
    targetY,
    targetPosition: targetPosition || Position.Top,
    borderRadius: 15,
  })

  const animatedStyle = {
    ...style,
    opacity: 0.2,
    strokeDasharray: '5,5',
    strokeDashoffset: '0',
    animation: 'dash 1s linear infinite',
  }

  return (
    <>
      <defs>
        <style>
          {`
            @keyframes dash {
              to {
                stroke-dashoffset: -10;
              }
            }
          `}
        </style>
      </defs>
      <BaseEdge type="smoothstep" path={edgePath} style={animatedStyle} markerEnd={markerEnd} />
    </>
  )
}
