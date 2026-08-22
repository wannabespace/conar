import { RiCloseLine, RiSearchLine } from '@remixicon/react'
import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { Button } from '@tamery/ui/components/button'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tamery/ui/components/input-group'
import { ReactFlowEdge } from '@tamery/ui/components/react-flow/edge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useMountedEffect } from '@tamery/ui/hookas/use-mounted-effect'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useQueries, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import type { CSSProperties } from 'react'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { ReactFlowNode } from '~/entities/connection/components'
import type { constraintsType } from '~/entities/connection/queries'
import {
  resourceConstraintsQueryOptions,
  resourceTableColumnsQueryOptions,
  resourceTablesAndSchemasQueryOptions,
} from '~/entities/connection/queries'
import type { columnType } from '~/entities/connection/queries/columns'
import {
  getConnectionResourceStore,
  setVisualizerViewport,
} from '~/entities/connection/store'
import {
  applySearchHighlight,
  getVisualizerLayout,
} from '~/entities/connection/visualizer'
import { globalHooks } from '~/global-hooks'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const nodeTypes = {
  tableNode: ReactFlowNode,
}
const edgeTypes = {
  custom: ReactFlowEdge,
}

const Visualizer = ({
  tablesAndSchemas,
  columns,
  constraints,
}: {
  tablesAndSchemas: { schema: string; table: string }[]
  columns: (typeof columnType.infer)[]
  constraints: (typeof constraintsType.infer)[]
}) => {
  const { connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const schemas = [...new Set(tablesAndSchemas.map(({ schema }) => schema))]
  const initialSchema = schemas[0] ?? ''
  const [schema, setSchema] = useState(initialSchema)
  const savedViewport = store.get().visualizerViewports?.[schema]
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const trimmedSearchQuery = searchQuery.trim().toLowerCase()
  const schemaConstraints = constraints.filter(
    (c) =>
      c.schema === schema && (!c.foreignSchema || c.foreignSchema === schema)
  )
  const tables = tablesAndSchemas
    .filter((t) => t.schema === schema)
    .map(({ table }) => table)

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () =>
      getVisualizerLayout({
        columns,
        constraints: schemaConstraints,
        resourceId: connectionResource.id,
        schema,
        tables,
      }),
    [connectionResource.id, schema, tables, columns, schemaConstraints]
  )

  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges)
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes)

  const recalculateLayout = () => {
    const { nodes: nextNodes, edges: nextEdges } = getVisualizerLayout({
      columns,
      constraints: schemaConstraints,
      resourceId: connectionResource.id,
      schema,
      tables,
    })

    setNodes(
      applySearchHighlight({
        columns,
        nodes: nextNodes,
        searchQuery: trimmedSearchQuery,
        tables,
      })
    )
    setEdges(nextEdges)
  }

  const recalculateLayoutEvent = useEffectEvent(recalculateLayout)

  useEffect(
    () =>
      globalHooks.hook('animationFinished', () => {
        recalculateLayoutEvent()
      }),
    []
  )

  useMountedEffect(() => {
    recalculateLayoutEvent()
  }, [schema])

  useHotkey('Mod+F', () => {
    searchRef.current?.focus()
  })

  return (
    <div className="relative size-full overflow-hidden rounded-lg">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <div className="relative w-56">
          <InputGroup>
            <InputGroupInput
              ref={searchRef}
              placeholder="Search tables"
              value={searchQuery}
              autoFocus
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setNodes((currentNodes) =>
                  applySearchHighlight({
                    columns,
                    nodes: currentNodes,
                    searchQuery: e.target.value.trim(),
                    tables,
                  })
                )
              }}
            />
            <InputGroupAddon>
              <RiSearchLine className="text-muted-foreground pointer-events-none size-3.5" />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              {!searchQuery && (
                <div className="text-muted-foreground pointer-events-none flex items-center gap-1 text-xs">
                  <KbdCtrlLetter userAgent={navigator.userAgent} letter="F" />
                </div>
              )}

              {searchQuery && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Clear table search"
                        className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                        onClick={() => setSearchQuery('')}
                      />
                    }
                  >
                    <RiCloseLine className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Clear</TooltipContent>
                </Tooltip>
              )}
            </InputGroupAddon>
          </InputGroup>
        </div>
        <Select
          value={schema}
          onValueChange={(v) => {
            if (v) {
              setSchema(v)
              setSearchQuery('')
            }
          }}
        >
          <SelectTrigger data-mask className="max-w-56 min-w-45">
            <div className="flex flex-1 items-center gap-2 overflow-hidden text-left">
              <span className="text-muted-foreground shrink-0">schema</span>
              <span className="truncate">
                <SelectValue placeholder="Select schema" />
              </span>
            </div>
          </SelectTrigger>
          <SelectContent data-mask>
            {schemas.map((schemaName) => (
              <SelectItem key={schemaName} value={schemaName}>
                {schemaName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ReactFlow
        key={schema}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onMoveEnd={(_, viewport) =>
          setVisualizerViewport(connectionResource.id, schema, viewport)
        }
        panOnScroll
        selectionOnDrag
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={savedViewport}
        fitView={!savedViewport}
        minZoom={0.3}
        maxZoom={4}
        defaultEdgeOptions={{
          type: 'custom',
        }}
        style={
          {
            '--xy-attribution-background-color-default': 'transparent',
            '--xy-background-pattern-dots-color-default': 'var(--color-border)',
            '--xy-edge-stroke-default': 'var(--color-foreground)',
            '--xy-edge-stroke-selected-default': 'var(--color-foreground)',
            '--xy-edge-stroke-width-default': 1.5,
          } as CSSProperties
        }
        attributionPosition="bottom-left"
      >
        <Background
          bgColor="var(--background)"
          variant={BackgroundVariant.Dots}
          gap={20}
          size={2}
        />
        <MiniMap
          pannable
          zoomable
          bgColor="var(--background)"
          nodeColor="var(--muted)"
        />
      </ReactFlow>
    </div>
  )
}

export const VisualizerTab = () => {
  const { connection, connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, {
    selector: (state) => state.showSystem,
  })
  const { data: tablesAndSchemas } = useQuery({
    ...resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem }),
    select: (data) =>
      data.schemas.flatMap(({ name, tables }) =>
        tables.map((table) => ({ schema: name, table: table.name }))
      ),
  })
  const columnsQueries = useQueries({
    queries:
      tablesAndSchemas?.flatMap(({ schema, table }) =>
        resourceTableColumnsQueryOptions({ connectionResource, schema, table })
      ) ?? [],
  })
  const { data: constraints } = useQuery(
    resourceConstraintsQueryOptions({ connectionResource })
  )

  if (
    !tablesAndSchemas ||
    !constraints ||
    columnsQueries.some((q) => q.isPending)
  ) {
    return (
      <div className="bg-background flex size-full items-center justify-center rounded-lg border">
        <AppLogo className="text-muted-foreground size-40 animate-pulse" />
      </div>
    )
  }

  const columns = columnsQueries
    .flatMap((item) => item.data)
    .filter((item): item is typeof columnType.infer => !!item)

  if (columns.length === 0 || tablesAndSchemas.length === 0) {
    return (
      <div className="bg-background flex size-full items-center justify-center rounded-lg border">
        <p className="text-muted-foreground">No data to show</p>
      </div>
    )
  }

  return (
    <ReactFlowProvider key={connection.id}>
      <Visualizer
        tablesAndSchemas={tablesAndSchemas}
        columns={columns}
        constraints={constraints}
      />
    </ReactFlowProvider>
  )
}
