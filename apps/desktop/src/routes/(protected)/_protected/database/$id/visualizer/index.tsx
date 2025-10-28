import type { constraintsType, tablesAndSchemasType } from '~/entities/database'
import type { columnType } from '~/entities/database/sql/columns'
import { title } from '@conar/shared/utils/title'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { ReactFlowEdge } from '@conar/ui/components/react-flow/edge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { useQueries, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Background, BackgroundVariant, MiniMap, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState } from '@xyflow/react'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { animationHooks } from '~/enter'
import { databaseConstraintsQuery, databaseTableColumnsQuery, prefetchDatabaseCore, ReactFlowNode, tablesAndSchemasQuery } from '~/entities/database'
import { getEdges, getLayoutElements, getNodes } from './-lib'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/visualizer/',
)({
  component: VisualizerPage,
  loader: ({ context }) => {
    prefetchDatabaseCore(context.database)

    return { database: context.database }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title('Visualizer', loaderData.database.name) }] : [],
  }),
})

function VisualizerPage() {
  const { database } = Route.useLoaderData()
  const { data: tablesAndSchemas } = useQuery({
    ...tablesAndSchemasQuery({ database }),
    select: data => data.schemas.flatMap(({ name, tables }) => tables.map(table => ({ schema: name, table }))),
  })
  const columnsQueries = useQueries({
    queries: tablesAndSchemas?.flatMap(({ schema, table }) =>
      databaseTableColumnsQuery({ database, schema, table }),
    ) ?? [],
  })
  const { data: constraints } = useQuery(databaseConstraintsQuery({ database }))

  if (!tablesAndSchemas || !constraints || columnsQueries.some(q => q.isPending)) {
    return (
      <div className="size-full flex items-center border rounded-lg justify-center bg-background">
        <AppLogo className="size-40 text-muted-foreground animate-pulse" />
      </div>
    )
  }

  const columns = columnsQueries.flatMap(item => item.data).filter((item): item is typeof columnType.infer => !!item)

  if (columns.length === 0 || tablesAndSchemas.length === 0) {
    return (
      <div className="size-full flex items-center border rounded-lg justify-center bg-background">
        <p className="text-muted-foreground">No data to show</p>
      </div>
    )
  }

  return (
    // Need to re-render the whole visualizer when the database changes due to recalculation of sizes
    <ReactFlowProvider key={database.id}>
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

function Visualizer({
  tablesAndSchemas,
  columns,
  constraints,
}: {
  tablesAndSchemas: typeof tablesAndSchemasType.infer[]
  columns: typeof columnType.infer[]
  constraints: typeof constraintsType.infer[]
}) {
  const { database } = Route.useRouteContext()
  const schemas = [...new Set(tablesAndSchemas.map(({ schema }) => schema))]
  const [schema, setSchema] = useState(schemas[0]!)
  const schemaTables = tablesAndSchemas.filter(t => t.schema === schema).map(({ table }) => table)

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(() => {
    const edges = getEdges({ constraints })
    return getLayoutElements(
      getNodes({
        databaseId: database.id,
        schema,
        tables: schemaTables,
        columns,
        edges,
        constraints,
      }),
      edges,
    )
  }, [database.id, schema, schemaTables, columns, constraints])

  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges)
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes)

  const recalculateLayoutEvent = useEffectEvent(() => {
    const edges = getEdges({ constraints })
    const { nodes: layoutNodes, edges: layoutEdges } = getLayoutElements(
      getNodes({
        databaseId: database.id,
        schema,
        tables: schemaTables,
        columns,
        edges,
        constraints,
      }),
      edges,
    )

    setNodes(layoutNodes)
    setEdges(layoutEdges)
  })

  useEffect(() => {
    // It's needed for fixing lines between nodes
    // Because lines started calculation before the app loaded
    return animationHooks.hook('finished', () => {
      recalculateLayoutEvent()
    })
  }, [])

  useMountedEffect(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    recalculateLayoutEvent()
  }, [schema])

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
