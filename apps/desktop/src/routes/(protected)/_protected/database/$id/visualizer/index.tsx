import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { ReactFlowEdge } from '@conar/ui/components/react-flow/edge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { createFileRoute } from '@tanstack/react-router'
import { Background, BackgroundVariant, MiniMap, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState } from '@xyflow/react'
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { animationHooks } from '~/enter'
import { databaseTableColumnsQuery, databaseTableConstraintsQuery, ReactFlowNode, tablesAndSchemasQuery } from '~/entities/database'
import { databaseForeignKeysQuery } from '~/entities/database/queries/foreign-keys'
import { queryClient } from '~/main'
import { getEdges, getLayoutedElements, getNodes } from './-lib'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/visualizer/',
)({
  loader: async ({ context }) => {
    const tablesAndSchemas = await queryClient.ensureQueryData(tablesAndSchemasQuery({ database: context.database }))
      .then(data => data.schemas.flatMap(({ name, tables }) => tables.map(table => ({ schema: name, table }))))
    const foreignKeys = await queryClient.ensureQueryData(databaseForeignKeysQuery({ database: context.database }))
    const columns = (await Promise.all(
      tablesAndSchemas.flatMap(({ schema, table }) =>
        queryClient.ensureQueryData(databaseTableColumnsQuery({ database: context.database, schema, table })),
      ),
    )).flat()
    const constraints = (await Promise.all(
      tablesAndSchemas.flatMap(({ schema, table }) =>
        queryClient.ensureQueryData(databaseTableConstraintsQuery({ database: context.database, schema, table })),
      ),
    )).flat()

    return {
      tablesAndSchemas,
      foreignKeys,
      columns,
      constraints,
    }
  },
  component: RouteComponent,
  pendingComponent: () => (
    <div className="size-full flex items-center border rounded-lg justify-center bg-background">
      <AppLogo className="size-40 text-muted-foreground animate-pulse" />
    </div>
  ),
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    // Need to re-render the whole visualizer when the database changes due to recalculation of sizes
    <ReactFlowProvider key={id}>
      <Visualizer />
    </ReactFlowProvider>
  )
}

const nodeTypes = {
  tableNode: ReactFlowNode,
}
const edgeTypes = {
  custom: ReactFlowEdge,
}

function Visualizer() {
  const { id } = Route.useParams()
  const { tablesAndSchemas, foreignKeys, columns, constraints } = Route.useLoaderData()
  const schemas = useMemo(() => [...new Set(tablesAndSchemas.map(({ schema }) => schema))], [tablesAndSchemas])
  const [schema, setSchema] = useState(schemas[0]!)
  const schemaTables = useMemo(() => tablesAndSchemas
    .filter(t => t.schema === schema)
    .map(({ table }) => table), [tablesAndSchemas, schema])

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const edges = getEdges({ foreignKeys })
    return getLayoutedElements(
      getNodes({
        databaseId: id,
        schema,
        tables: schemaTables,
        columns,
        edges,
        foreignKeys,
        constraints,
      }),
      edges,
    )
  }, [id, schema, schemaTables, columns, foreignKeys, constraints])

  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)

  const recalculateLayout = useCallback(() => {
    const edges = getEdges({ foreignKeys })
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      getNodes({
        databaseId: id,
        schema,
        tables: schemaTables,
        columns,
        edges,
        foreignKeys,
        constraints,
      }),
      edges,
    )

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [id, schema, schemaTables, columns, foreignKeys, constraints, setNodes, setEdges])

  const recalculateLayoutEvent = useEffectEvent(recalculateLayout)

  useEffect(() => {
    // It's needed for fixing lines between nodes
    // Because lines started calculation before the app loaded
    return animationHooks.hook('finished', () => {
      recalculateLayoutEvent()
    })
  }, [])

  useMountedEffect(() => {
    recalculateLayout()
  }, [schema, recalculateLayout])

  return (
    <div className="relative size-full overflow-hidden rounded-lg border/10 dark:border">
      <div className="absolute z-10 top-2 right-2">
        <Select
          value={schema}
          onValueChange={setSchema}
        >
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                schema
              </span>
              <SelectValue placeholder="Select schema" />
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
        style={
          {
            '--xy-background-pattern-dots-color-default': 'var(--color-border)',
            '--xy-edge-stroke-width-default': 1.5,
            '--xy-edge-stroke-default': 'var(--color-foreground)',
            '--xy-edge-stroke-selected-default': 'var(--color-foreground)',
            '--xy-attribution-background-color-default': 'transparent',
          } as React.CSSProperties
        }
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
