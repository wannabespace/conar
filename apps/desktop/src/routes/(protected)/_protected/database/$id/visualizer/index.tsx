import type { columnType } from '@conar/shared/sql/columns'
import type { constraintsType } from '@conar/shared/sql/constraints'
import type { foreignKeysType } from '@conar/shared/sql/foreign-keys'
import { ReactFlowEdge } from '@conar/ui/components/react-flow/edge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { useMountedEffect } from '@conar/ui/hookas/use-mounted-effect'
import { useSuspenseQueries, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Background, BackgroundVariant, MiniMap, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow } from '@xyflow/react'
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
    const tablesAndSchemas = await queryClient.ensureQueryData(
      tablesAndSchemasQuery({ database: context.database }),
    )
    await queryClient.prefetchQuery(databaseForeignKeysQuery({ database: context.database }))

    await Promise.all(
      tablesAndSchemas.schemas.flatMap(({ name, tables }) => tables.map(table =>
        queryClient.prefetchQuery(databaseTableColumnsQuery({ database: context.database, schema: name, table })),
      )),
    )
    await Promise.all(
      tablesAndSchemas.schemas.flatMap(({ name, tables }) => tables.map(table =>
        queryClient.prefetchQuery(databaseTableConstraintsQuery({ database: context.database, schema: name, table })),
      )),
    )
  },
  component: RouteComponent,
  pendingComponent: () => <div className="size-full flex items-center border rounded-lg justify-center bg-background">Loading...</div>,
})

function RouteComponent() {
  const { database } = Route.useRouteContext()
  const { data: tablesAndSchemas } = useSuspenseQuery({
    ...tablesAndSchemasQuery({ database }),
    select: data => data.schemas.flatMap(schema =>
      schema.tables.map(table => ({
        schema: schema.name,
        table,
      })),
    ),
  })
  const { data: foreignKeys } = useSuspenseQuery(databaseForeignKeysQuery({ database }))
  const columns = useSuspenseQueries({
    queries: tablesAndSchemas.map(({ schema, table }) => databaseTableColumnsQuery({ database, schema, table })),
    combine: results => results.flatMap(r => r.data).filter((c): c is typeof columnType.infer => !!c),
  })
  const constraints = useSuspenseQueries({
    queries: tablesAndSchemas.map(({ schema, table }) => databaseTableConstraintsQuery({ database, schema, table })),
    combine: results => results.flatMap(r => r.data).filter((c): c is typeof constraintsType.infer => !!c),
  })

  return (
    <ReactFlowProvider>
      <Visualizer
        tablesAndSchemas={tablesAndSchemas}
        foreignKeys={foreignKeys}
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

function Visualizer({ tablesAndSchemas, foreignKeys, columns, constraints }: { tablesAndSchemas: { schema: string, table: string }[], foreignKeys: typeof foreignKeysType.infer[], columns: typeof columnType.infer[], constraints: typeof constraintsType.infer[] }) {
  const { database } = Route.useRouteContext()
  const { fitView } = useReactFlow()
  const schemas = useMemo(() => [...new Set(tablesAndSchemas.map(({ schema }) => schema))], [tablesAndSchemas])
  const [schema, setSchema] = useState(schemas[0]!)
  const schemaTables = useMemo(() => tablesAndSchemas
    .filter(t => t.schema === schema)
    .map(({ table }) => table), [tablesAndSchemas, schema])

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const edges = getEdges({ foreignKeys })
    return getLayoutedElements(
      getNodes({
        databaseId: database.id,
        schema,
        tables: schemaTables,
        columns,
        edges,
        foreignKeys,
        constraints,
      }),
      edges,
    )
  }, [database.id, schema, schemaTables, columns, foreignKeys, constraints])

  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)

  const recalculateLayout = useCallback(() => {
    const edges = getEdges({ foreignKeys })
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      getNodes({
        databaseId: database.id,
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

    setTimeout(() => {
      fitView({ padding: 0.1, duration: 800 })
    }, 0)
  }, [database.id, schema, schemaTables, columns, foreignKeys, constraints, fitView, setNodes, setEdges])

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
        maxZoom={2}
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
