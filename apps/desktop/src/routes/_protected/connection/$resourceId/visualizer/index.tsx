import type { constraintsType } from '~/entities/connection/queries'
import type { columnType } from '~/entities/connection/queries/columns'
import { title } from '@conar/shared/utils/title'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { KbdCtrlLetter } from '@conar/ui/components/custom/shortcuts'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@conar/ui/components/input-group'
import { ReactFlowEdge } from '@conar/ui/components/react-flow/edge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { RiCloseLine, RiSearchLine } from '@remixicon/react'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useQueries, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Background, BackgroundVariant, MiniMap, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState } from '@xyflow/react'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { ReactFlowNode } from '~/entities/connection/components'
import { resourceConstraintsQueryOptions, resourceTableColumnsQueryOptions, resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { prefetchConnectionResourceCore } from '~/entities/connection/utils'
import { globalHooks } from '~/global-hooks'
import { applySearchHighlight, getVisualizerLayout } from './-lib'

export const Route = createFileRoute(
  '/_protected/connection/$resourceId/visualizer/',
)({
  component: VisualizerPage,
  loader: ({ context }) => {
    prefetchConnectionResourceCore(context.connectionResource)
    return { connection: context.connection, connectionResource: context.connectionResource }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title('Visualizer', loaderData.connection.name, loaderData.connectionResource.name) }] : [],
  }),
})

// eslint-disable-next-line react-refresh/only-export-components
function VisualizerPage() {
  const { connection } = Route.useLoaderData()
  const { connectionResource } = Route.useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, { selector: state => state.showSystem })
  const { data: tablesAndSchemas } = useQuery({
    ...resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem }),
    select: data => data.schemas.flatMap(({ name, tables }) => tables.map(table => ({ schema: name, table: table.name }))),
  })
  const columnsQueries = useQueries({
    queries: tablesAndSchemas?.flatMap(({ schema, table }) =>
      resourceTableColumnsQueryOptions({ connectionResource, schema, table }),
    ) ?? [],
  })
  const { data: constraints } = useQuery(resourceConstraintsQueryOptions({ connectionResource }))

  if (!tablesAndSchemas || !constraints || columnsQueries.some(q => q.isPending)) {
    return (
      <div className="
        flex size-full items-center justify-center rounded-lg border
        bg-background
      "
      >
        <AppLogo className="size-40 animate-pulse text-muted-foreground" />
      </div>
    )
  }

  const columns = columnsQueries.flatMap(item => item.data).filter((item): item is typeof columnType.infer => !!item)

  if (columns.length === 0 || tablesAndSchemas.length === 0) {
    return (
      <div className="
        flex size-full items-center justify-center rounded-lg border
        bg-background
      "
      >
        <p className="text-muted-foreground">No data to show</p>
      </div>
    )
  }

  return (
    // Need to re-render the whole visualizer when the database changes due to recalculation of sizes
    <ReactFlowProvider key={connection.id}>
      <Visualizer
        tablesAndSchemas={tablesAndSchemas}
        columns={columns}
        constraints={constraints}
      />
    </ReactFlowProvider>
  )
}

const nodeTypes = {
  tableNode: ReactFlowNode,
}
const edgeTypes = {
  custom: ReactFlowEdge,
}

// eslint-disable-next-line react-refresh/only-export-components
function Visualizer({
  tablesAndSchemas,
  columns,
  constraints,
}: {
  tablesAndSchemas: { schema: string, table: string }[]
  columns: typeof columnType.infer[]
  constraints: typeof constraintsType.infer[]
}) {
  const { connectionResource } = Route.useRouteContext()
  const schemas = [...new Set(tablesAndSchemas.map(({ schema }) => schema))]
  const [schema, setSchema] = useState(schemas[0]!)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const trimmedSearchQuery = searchQuery.trim().toLowerCase()
  const schemaConstraints = constraints.filter(
    c => c.schema === schema && (!c.foreignSchema || c.foreignSchema === schema),
  )
  const tables = tablesAndSchemas.filter(t => t.schema === schema).map(({ table }) => table)

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(() => {
    return getVisualizerLayout({
      resourceId: connectionResource.id,
      schema,
      tables,
      columns,
      constraints: schemaConstraints,
    })
  }, [connectionResource.id, schema, tables, columns, schemaConstraints])

  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges)
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes)

  const recalculateLayout = () => {
    const { nodes, edges } = getVisualizerLayout({
      resourceId: connectionResource.id,
      schema,
      tables,
      columns,
      constraints: schemaConstraints,
    })

    setNodes(applySearchHighlight({
      nodes,
      searchQuery: trimmedSearchQuery,
      tables,
      columns,
    }))
    setEdges(edges)
  }

  const recalculateLayoutEvent = useEffectEvent(recalculateLayout)

  useEffect(() => {
    // It's needed for fixing lines between nodes
    // Because lines started calculation before the app loaded
    return globalHooks.hook('animationFinished', () => {
      recalculateLayoutEvent()
    })
  }, [])

  useMountedEffect(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
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
                setNodes(nodes => applySearchHighlight({
                  nodes,
                  searchQuery: e.target.value.trim(),
                  tables,
                  columns,
                }))
              }}
            />
            <InputGroupAddon>
              <RiSearchLine className="
                pointer-events-none size-3.5 text-muted-foreground
              "
              />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              {!searchQuery && (
                <div className="
                  pointer-events-none flex items-center gap-1 text-xs
                  text-muted-foreground
                "
                >
                  <KbdCtrlLetter userAgent={navigator.userAgent} letter="F" />
                </div>
              )}

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear table search"
                >
                  <RiCloseLine className="size-4 text-muted-foreground" />
                </button>
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
          <SelectTrigger className="max-w-56 min-w-45">
            <div className="
              flex flex-1 items-center gap-2 overflow-hidden text-left
            "
            >
              <span className="shrink-0 text-muted-foreground">
                schema
              </span>
              <span className="truncate"><SelectValue placeholder="Select schema" /></span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {schemas.map(schema => (
              <SelectItem key={schema} value={schema}>
                {schema}
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
        panOnScroll
        selectionOnDrag
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.3}
        maxZoom={4}
        defaultEdgeOptions={{
          type: 'custom',
        }}
        style={{
          '--xy-background-pattern-dots-color-default': 'var(--color-border)',
          '--xy-edge-stroke-width-default': 1.5,
          '--xy-edge-stroke-default': 'var(--color-foreground)',
          '--xy-edge-stroke-selected-default': 'var(--color-foreground)',
          '--xy-attribution-background-color-default': 'transparent',
        }}
        attributionPosition="bottom-left"
      >
        <Background bgColor="var(--background)" variant={BackgroundVariant.Dots} gap={20} size={2} />
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
