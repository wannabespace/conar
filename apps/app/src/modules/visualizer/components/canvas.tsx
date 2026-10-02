import {
  MinusSignIcon,
  PlusSignIcon,
  Structure01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import type {
  Connection,
  EdgeChange,
  NodeChange,
  Viewport,
} from '@xyflow/react'
import {
  Background,
  BackgroundVariant,
  ControlButton,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  useStore,
} from '@xyflow/react'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'

import { useDiagram } from '../lib/context'
import type { Positions } from '../lib/positions'
import { relationEdge, tableNode } from './elements'
import type { RelationEdge } from './relation-edge'
import { RelationEdgeView } from './relation-edge'
import { handleColumn } from './row-handles'
import type { TableNode } from './table-node'
import { TableNodeView } from './table-node'

const nodeTypes = { table: TableNodeView }
const edgeTypes = { relation: RelationEdgeView }

/* oxlint-disable shadcn/no-inline-styles -- xyflow reads its theme only from these vars */
const flowStyle = {
  '--xy-attribution-background-color-default': 'transparent',
  '--xy-background-pattern-dots-color-default': 'var(--color-border)',
  '--xy-controls-box-shadow-default': 'none',
  '--xy-controls-button-background-color-default': 'var(--color-popover)',
  '--xy-controls-button-background-color-hover-default': 'var(--color-accent)',
  '--xy-controls-button-border-color-default':
    'color-mix(in oklch, var(--color-foreground) 6%, transparent)',
  '--xy-controls-button-color-default': 'var(--color-muted-foreground)',
  '--xy-controls-button-color-hover-default': 'var(--color-foreground)',
  '--xy-minimap-background-color-default': 'var(--color-popover)',
  '--xy-minimap-mask-background-color-default':
    'color-mix(in oklch, var(--color-foreground) 6%, transparent)',
  '--xy-minimap-node-background-color-default':
    'color-mix(in oklch, var(--color-foreground) 35%, transparent)',
} as CSSProperties
/* oxlint-enable shadcn/no-inline-styles */

const MIN_ZOOM = 0.2
const MAX_ZOOM = 2.5
export const fitViewOptions = { maxZoom: 1, padding: 0.15 }

// Zoom reaches the compact card labels as a CSS variable, so a wheel tick
// re-renders no card.
const ZoomVariable = () => {
  const zoom = useStore((state) => state.transform[2])
  const domNode = useStore((state) => state.domNode)

  useEffect(() => {
    domNode?.style.setProperty('--diagram-zoom', String(zoom))
  }, [domNode, zoom])

  return null
}

const isValidConnection = ({
  source,
  sourceHandle,
  target,
  targetHandle,
}: Connection | RelationEdge) =>
  source !== target ||
  handleColumn(sourceHandle ?? '') !== handleColumn(targetHandle ?? '')

export const Canvas = ({
  defaultViewport,
  onEdgeSelect,
  onPositionsChange,
  onPositionsCommit,
  onResetLayout,
  onViewportChange,
  positions,
  selectedEdgeId,
}: {
  defaultViewport: Viewport | undefined
  onEdgeSelect: (id: string | null) => void
  onPositionsChange: (positions: Positions) => void
  onPositionsCommit: (positions: Positions) => void
  onResetLayout: () => void
  onViewportChange: (viewport: Viewport) => void
  positions: Positions
  selectedEdgeId: string | null
}) => {
  const { actions, can, diagram, selectedId } = useDiagram()
  const flow = useReactFlow()
  // React Flow reports measured sizes through dimension changes; nodes rebuilt
  // without them stay unmeasured and vanish from the minimap.
  const [measured, setMeasured] = useState<
    Record<string, { height: number; width: number }>
  >({})

  const nodes = diagram.tables.map((table) =>
    tableNode(
      table,
      positions[table.id] ?? { x: 0, y: 0 },
      table.id === selectedId,
      measured[table.id]
    )
  )

  const handleNodesChange = (changes: NodeChange<TableNode>[]) => {
    const moved = changes.flatMap((change) =>
      change.type === 'position' && change.position
        ? [[change.id, change.position] as const]
        : []
    )
    if (moved.length > 0) {
      const next = { ...positions, ...Object.fromEntries(moved) }
      onPositionsChange(next)
      if (changes.some((c) => c.type === 'position' && !c.dragging)) {
        onPositionsCommit(next)
      }
    }
    const sized = changes.flatMap((change) =>
      change.type === 'dimensions' && change.dimensions
        ? [[change.id, change.dimensions] as const]
        : []
    )
    if (sized.length > 0) {
      setMeasured((current) => ({ ...current, ...Object.fromEntries(sized) }))
    }
    for (const change of changes) {
      if (change.type === 'select' && change.selected) {
        actions.select(change.id)
        onEdgeSelect(null)
      }
    }
  }

  const handleEdgesChange = (changes: EdgeChange<RelationEdge>[]) => {
    for (const change of changes) {
      if (change.type === 'select' && change.selected) {
        onEdgeSelect(change.id)
        actions.select(null)
      }
    }
  }

  const controls = [
    {
      icon: PlusSignIcon,
      label: 'Zoom in',
      onClick: () => flow.zoomIn(),
    },
    {
      icon: MinusSignIcon,
      label: 'Zoom out',
      onClick: () => flow.zoomOut(),
    },
    {
      icon: Structure01Icon,
      label: 'Arrange tables automatically',
      onClick: onResetLayout,
    },
  ]

  return (
    <ReactFlow
      nodes={nodes}
      edges={diagram.relations.map((relation) =>
        relationEdge(relation, positions, relation.id === selectedEdgeId)
      )}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onPaneClick={() => {
        onEdgeSelect(null)
        actions.select(null)
      }}
      onConnect={(connection) => {
        if (!connection.sourceHandle || !connection.targetHandle) {
          return
        }
        actions.linkColumns({
          column: handleColumn(connection.sourceHandle),
          foreignColumn: handleColumn(connection.targetHandle),
          foreignTable: connection.target,
          table: connection.source,
        })
      }}
      isValidConnection={isValidConnection}
      nodesConnectable={can.edit && can.foreignKeys}
      connectionRadius={24}
      onMoveEnd={(_, viewport) => onViewportChange(viewport)}
      defaultViewport={defaultViewport}
      fitView={!defaultViewport}
      fitViewOptions={fitViewOptions}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      panOnScroll
      onlyRenderVisibleElements
      deleteKeyCode={null}
      proOptions={{ hideAttribution: true }}
      style={flowStyle}
      className="bg-background"
    >
      <ZoomVariable />
      <Background
        bgColor="var(--color-background)"
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1.5}
      />
      <Controls
        position="bottom-left"
        showInteractive={false}
        showFitView={false}
        showZoom={false}
        className="ring-foreground/4 overflow-hidden rounded-xl shadow-md ring"
      >
        {controls.map(({ icon, label, onClick }) => (
          <Tooltip key={label}>
            <TooltipTrigger
              render={<ControlButton onClick={onClick} aria-label={label} />}
            >
              <HugeiconsIcon icon={icon} strokeWidth={2} />
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ))}
      </Controls>
      <MiniMap
        position="bottom-right"
        pannable
        zoomable
        className="ring-foreground/4 rounded-xl shadow-md ring"
        nodeStrokeWidth={0}
        nodeBorderRadius={4}
      />
    </ReactFlow>
  )
}
