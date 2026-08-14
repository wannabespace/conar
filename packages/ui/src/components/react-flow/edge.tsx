import type { EdgeProps } from '@xyflow/react'
import { BaseEdge, getSmoothStepPath, Position } from '@xyflow/react'

export const ReactFlowEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
}: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    borderRadius: 15,
    sourcePosition: sourcePosition || Position.Bottom,
    sourceX,
    sourceY,
    targetPosition: targetPosition || Position.Top,
    targetX,
    targetY,
  })

  const animatedStyle = {
    ...style,
    animation: 'dash 1s linear infinite',
    opacity: 0.2,
    strokeDasharray: '5,5',
    strokeDashoffset: '0',
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
      <BaseEdge
        type="smoothstep"
        path={edgePath}
        style={animatedStyle}
        markerEnd={markerEnd}
      />
    </>
  )
}
