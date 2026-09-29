import { Structure01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useHotkey, useHotkeys } from '@tanstack/react-hotkeys'
import type { Connection, NodeChange, Viewport } from '@xyflow/react'
import {
  Background,
  BackgroundVariant,
  ControlButton,
  Controls,
  MiniMap,
  ReactFlow,
  useStore,
} from '@xyflow/react'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'

import { COMPACT_ZOOM, useDiagram } from '../-lib/context'
import type { Positions } from '../-lib/layout'
import type { Diagram, DiagramRelation } from '../-lib/schema'
import type { RelationEdge } from './relation-edge'
import { RelationEdgeView } from './relation-edge'
import type { TableNode } from './table-node'
import { handleId, parseHandleId, TableNodeView } from './table-node'

const nodeTypes = { table: TableNodeView }
const edgeTypes = { relation: RelationEdgeView }

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

const MIN_ZOOM = 0.2
const MAX_ZOOM = 2.5
const fitViewOptions = { maxZoom: 1, padding: 0.15 }

const edgesOf = (
  { relations }: Diagram,
  positions: Positions,
  selectedEdgeId: string | null
): RelationEdge[] =>
  relations.map((relation) => {
    const sourceX = positions[relation.source.table]?.x ?? 0
    const targetX = positions[relation.target.table]?.x ?? 0
    const forward = sourceX <= targetX

    return {
      data: { relation },
      id: relation.id,
      selected: relation.id === selectedEdgeId,
      source: relation.source.table,
      sourceHandle: handleId(
        relation.source.column,
        forward ? 'right' : 'left',
        'source'
      ),
      target: relation.target.table,
      targetHandle: handleId(
        relation.target.column,
        forward ? 'left' : 'right',
        'target'
      ),
      type: 'relation',
    }
  })

// Zoom reaches the cards as a CSS variable and one boolean in the view store,
// so a wheel tick re-renders nothing but the cards crossing the threshold.
const ZoomTracker = () => {
  const { view } = useDiagram()
  const zoom = useStore((state) => state.transform[2])
  const domNode = useStore((state) => state.domNode)

  useEffect(() => {
    domNode?.style.setProperty('--diagram-zoom', String(zoom))
    const compact = zoom < COMPACT_ZOOM
    if (view.get().compact !== compact) {
      view.set((state) => ({ ...state, compact }))
    }
  }, [domNode, view, zoom])

  return null
}

const isValidConnection = (connection: Connection | RelationEdge) =>
  connection.source !== connection.target &&
  !!connection.targetHandle &&
  parseHandleId(connection.targetHandle).kind === 'target'

export const Canvas = ({
  defaultViewport,
  onConnect,
  onPositionsChange,
  onPositionsCommit,
  onResetLayout,
  onViewportChange,
  positions,
}: {
  defaultViewport: Viewport | undefined
  onConnect: (connection: {
    column: string
    foreignColumn: string
    foreignTable: string
    table: string
  }) => void
  onPositionsChange: (positions: Positions) => void
  onPositionsCommit: () => void
  onResetLayout: () => void
  onViewportChange: (viewport: Viewport) => void
  positions: Positions
}) => {
  const { actions, can, diagram, selectedId } = useDiagram()
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  // React Flow reports measured sizes through dimension changes; nodes rebuilt
  // without them stay unmeasured and vanish from the minimap.
  const [measured, setMeasured] = useState<
    Record<string, { height: number; width: number }>
  >({})
  const selectedRelation = diagram.relations.find(
    (relation) => relation.id === selectedEdgeId
  )

  const nodes: TableNode[] = diagram.tables.map((table) => ({
    data: { table },
    id: table.id,
    measured: measured[table.id],
    position: positions[table.id] ?? { x: 0, y: 0 },
    selected: table.id === selectedId,
    type: 'table',
  }))

  const handleNodesChange = (changes: NodeChange<TableNode>[]) => {
    const moved = changes.flatMap((change) =>
      change.type === 'position' && change.position
        ? [[change.id, change.position] as const]
        : []
    )
    if (moved.length > 0) {
      onPositionsChange({ ...positions, ...Object.fromEntries(moved) })
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
        setSelectedEdgeId(null)
      }
    }
  }

  const dropSelectedRelation = (relation: DiagramRelation) => {
    actions.dropRelation(relation)
    setSelectedEdgeId(null)
  }

  useHotkeys(
    [
      {
        callback: () =>
          selectedRelation && dropSelectedRelation(selectedRelation),
        hotkey: 'Backspace',
      },
      {
        callback: () =>
          selectedRelation && dropSelectedRelation(selectedRelation),
        hotkey: 'Delete',
      },
    ],
    { enabled: !!selectedRelation && can.dropForeignKeys, preventDefault: true }
  )
  useHotkey(
    'Escape',
    (event) => {
      event.stopPropagation()
      setSelectedEdgeId(null)
    },
    { enabled: selectedEdgeId !== null }
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edgesOf(diagram, positions, selectedEdgeId)}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={handleNodesChange}
      onNodeDragStop={onPositionsCommit}
      onEdgeClick={(_, edge) => {
        setSelectedEdgeId(edge.id)
        actions.select(null)
      }}
      onPaneClick={() => {
        setSelectedEdgeId(null)
        actions.select(null)
      }}
      onConnect={(connection) => {
        if (!connection.sourceHandle || !connection.targetHandle) {
          return
        }
        onConnect({
          column: parseHandleId(connection.sourceHandle).column,
          foreignColumn: parseHandleId(connection.targetHandle).column,
          foreignTable: connection.target,
          table: connection.source,
        })
      }}
      isValidConnection={isValidConnection}
      nodesConnectable={can.foreignKeys}
      connectionRadius={24}
      onMoveEnd={(_, viewport) => onViewportChange(viewport)}
      defaultViewport={defaultViewport}
      fitView={!defaultViewport}
      fitViewOptions={fitViewOptions}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      panOnScroll
      selectionOnDrag
      onlyRenderVisibleElements
      deleteKeyCode={null}
      proOptions={{ hideAttribution: true }}
      style={flowStyle}
      className="bg-background"
    >
      <ZoomTracker />
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
        className="ring-foreground/4 overflow-hidden rounded-xl shadow-md ring"
      >
        <ControlButton
          onClick={onResetLayout}
          title="Arrange tables automatically"
          aria-label="Arrange tables automatically"
        >
          <HugeiconsIcon icon={Structure01Icon} strokeWidth={2} />
        </ControlButton>
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
