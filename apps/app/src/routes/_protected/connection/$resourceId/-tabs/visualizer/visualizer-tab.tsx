import { useHotkey } from '@tanstack/react-hotkeys'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { ReactFlowProvider, useReactFlow } from '@xyflow/react'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import {
  capabilitiesOf,
  defaultSchemaOf,
  sectionAvailable,
  sectionCapabilitiesOf,
} from '~/entities/connection/capabilities'
import type { constraintsType } from '~/entities/connection/queries/constraints/list'
import { resourceConstraintsQueryOptions } from '~/entities/connection/queries/constraints/list'
import {
  resourceIndexesQueryOptions,
  structureQueryKey,
} from '~/entities/connection/queries/indexes/list'
import { resourcePoliciesQueryOptions } from '~/entities/connection/queries/policies/list'
import type { columnType } from '~/entities/connection/queries/tables/columns'
import {
  resourceColumnsQueryKey,
  resourceColumnsQueryOptions,
} from '~/entities/connection/queries/tables/columns'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'
import type { NewColumn } from '~/entities/connection/queries/tables/shape'
import { resourceTriggersQueryOptions } from '~/entities/connection/queries/triggers/list'
import {
  connectionResourceToQueryParams,
  transaction,
} from '~/entities/connection/runtime/query'
import { openTableTab } from '~/entities/connection/store/helpers/tabs'
import { visualizerLayout } from '~/entities/connection/store/helpers/visualizer'
import { getConnectionResourceStore } from '~/entities/connection/store/stores'
import { tableTabId } from '~/entities/connection/store/tabs/ids'
import { useSaveHotkey } from '~/hooks/use-save-hotkey'
import { openNewWindow } from '~/lib/new-window'
import { queryClient } from '~/lib/query-client'

import { Canvas, fitViewOptions } from './-components/canvas'
import type { ColumnDialogRequest } from './-components/column-dialog'
import { ColumnDialog } from './-components/column-dialog'
import { Inspector } from './-components/inspector'
import { ReviewDrawer } from './-components/review-drawer'
import type { TableDialogRequest } from './-components/table-dialog'
import { TableDialog } from './-components/table-dialog'
import { plural, Toolbar } from './-components/toolbar'
import type { DiagramActions, DiagramContextValue } from './-lib/context'
import { DiagramContext, diagramViewStore } from './-lib/context'
import { diagramDrafts, diagramDraftsStore } from './-lib/drafts'
import type { Positions } from './-lib/layout'
import { NODE_WIDTH, layoutDiagram } from './-lib/layout'
import { draftQuery } from './-lib/queries'
import type { DiagramColumn, DiagramTable, TableKind } from './-lib/schema'
import { buildDiagram, tableNodeId } from './-lib/schema'
import type { DiagramDraft } from './-lib/statements'
import { VisualizerSkeleton } from './visualizer-skeleton'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const INSPECTOR_WIDTH = 320
const noRows: never[] = []

const Visualizer = ({
  columns,
  constraints,
  tables,
}: {
  columns: (typeof columnType.infer)[]
  constraints: (typeof constraintsType.infer)[]
  tables: { schema: string; table: string; type: TableKind }[]
}) => {
  const { connection, connectionResource } = useRouteContext()
  const router = useRouter()
  const flow = useReactFlow()
  const store = getConnectionResourceStore(connectionResource.id)
  const draftsStore = diagramDraftsStore(connectionResource.id)
  const drafts = useSubscription(draftsStore, {
    isEqual: Object.is,
    selector: (state) => state.drafts,
  })
  const edit = diagramDrafts(draftsStore)
  const capabilities = capabilitiesOf(connection.type)
  const can: DiagramContextValue['can'] = {
    cascade: capabilities.cascade,
    ddlRollback: capabilities.ddlRollback,
    dropForeignKeys: !!sectionCapabilitiesOf('constraints', connection.type)
      .drop,
    foreignKeys:
      capabilities.constraintKinds.includes('foreignKey') &&
      !!sectionCapabilitiesOf('constraints', connection.type).create,
    indexes: sectionAvailable('indexes', connection.type),
    policies: sectionAvailable('policies', connection.type),
    renameColumns: capabilities.renameColumns,
    schemas: capabilities.schemas,
    triggers: sectionAvailable('triggers', connection.type),
  }

  const defaultSchema = defaultSchemaOf(
    connection.type,
    connectionResource.name
  )
  const schemas = [
    ...new Set([
      ...tables.map(({ schema }) => schema),
      ...drafts.map((draft) => draft.schema),
    ]),
  ]
  if (schemas.length === 0 && defaultSchema) {
    schemas.push(defaultSchema)
  }
  const tableIds = new Set([
    ...tables.map((entry) => tableNodeId(entry.schema, entry.table)),
    ...drafts.flatMap((draft) => {
      if (draft.kind === 'createTable') {
        return [tableNodeId(draft.schema, draft.table)]
      }
      if (draft.kind === 'renameTable') {
        return [tableNodeId(draft.schema, draft.newName)]
      }
      return []
    }),
  ])
  const [pickedSchema, setPickedSchema] = useState<string>()
  const schema =
    [pickedSchema, defaultSchema].find(
      (name) => name && schemas.includes(name)
    ) ??
    schemas[0] ??
    ''

  const { data: indexes = noRows } = useQuery({
    ...resourceIndexesQueryOptions({ connectionResource }),
    enabled: can.indexes,
  })
  const { data: triggers = noRows } = useQuery({
    ...resourceTriggersQueryOptions({ connectionResource }),
    enabled: can.triggers,
  })
  const { data: policies = noRows } = useQuery({
    ...resourcePoliciesQueryOptions({ connectionResource }),
    enabled: can.policies,
  })

  const diagram = buildDiagram({
    columns,
    constraints,
    drafts,
    indexes,
    policies,
    schema,
    tables,
    triggers,
  })

  const savedPositions = useSubscription(store, {
    isEqual: Object.is,
    selector: (state) => state.visualizerPositions?.[schema],
  })
  const [draggedPositions, setDraggedPositions] = useState<Positions>({})
  // Draft tables carry their own position, so they stay out of the layout and
  // adding one never shuffles the rest.
  const autoLayout = layoutDiagram({
    relations: diagram.relations.filter((r) => r.state !== 'added'),
    tables: diagram.tables.filter((t) => t.state !== 'added'),
  })
  const positions: Positions = Object.fromEntries(
    diagram.tables.map((table) => [
      table.id,
      draggedPositions[table.id] ??
        savedPositions?.[table.id] ??
        autoLayout[table.id] ?? { x: 0, y: 0 },
    ])
  )
  const commitPositions = (next: Positions) =>
    visualizerLayout.setPositions(connectionResource.id, schema, next)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [tableRequest, setTableRequest] = useState<TableDialogRequest | null>(
    null
  )
  const [columnRequest, setColumnRequest] =
    useState<ColumnDialogRequest | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const selectedTable =
    diagram.tables.find((table) => table.id === selectedId) ?? null

  const originalShape = (table: DiagramTable, column: DiagramColumn) => {
    const base = columns.find(
      (c) =>
        c.schema === table.schema &&
        c.table === table.table &&
        c.id === column.id
    )
    return base
      ? { nullable: base.isNullable, type: base.typeLabel }
      : { nullable: column.nullable, type: column.type }
  }

  const actions: DiagramActions = {
    addColumn: (table) => setColumnRequest({ column: null, table }),
    createTable: () => setTableRequest({ schema, table: null }),
    dropColumn: (table, column) => edit.dropColumn(table, column.id),
    dropRelation: (relation) => {
      const source = diagram.tables.find((t) => t.id === relation.source.table)
      if (source) {
        edit.dropForeignKey(source, relation.name)
      }
    },
    dropTable: (table, cascade) => edit.dropTable(table, cascade),
    editColumn: (table, column) => setColumnRequest({ column, table }),
    focusRelation: (relation) => {
      flow.fitView({
        duration: 300,
        maxZoom: 1,
        nodes: [{ id: relation.source.table }, { id: relation.target.table }],
        padding: 0.2,
      })
    },
    openTable: (table, newWindow) => {
      openTableTab(connectionResource.id, table.schema, table.table)
      const location = {
        params: {
          resourceId: connectionResource.id,
          tabId: tableTabId(table.schema, table.table),
        },
        to: '/connection/$resourceId/$tabId' as const,
      }
      if (newWindow) {
        openNewWindow(router.buildLocation(location).href)
        return
      }
      void router.navigate(location)
    },
    renameTable: (table) => setTableRequest({ schema: table.schema, table }),
    restoreTable: (table) => edit.restoreTable(table),
    select: (id) => setSelectedId(id),
    toggleNullable: (table, column) =>
      edit.alterColumn(
        table,
        column.id,
        { nullable: !column.nullable, type: column.type },
        originalShape(table, column)
      ),
  }

  const submitColumn = (
    { column, table }: ColumnDialogRequest,
    next: NewColumn
  ) => {
    if (column === null) {
      edit.addColumn(table, next)
    } else {
      if (next.name !== column.name) {
        edit.renameColumn(table, column.id, next.name)
      }
      if (next.type !== column.type || next.nullable !== column.nullable) {
        edit.alterColumn(
          table,
          column.state === 'added' ? next.name : column.id,
          { nullable: next.nullable, type: next.type },
          originalShape(table, column)
        )
      }
    }
    setColumnRequest(null)
  }

  const submitTable = (
    { table }: TableDialogRequest,
    targetSchema: string,
    name: string
  ) => {
    if (table) {
      edit.renameTable(table, name)
    } else {
      edit.createTable({ schema: targetSchema, table: name }, [
        {
          name: 'id',
          nullable: false,
          primaryKey: true,
          type: capabilities.idColumnType,
        },
      ])
      const id = tableNodeId(targetSchema, name)
      const center = flow.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })
      setDraggedPositions((current) => ({
        ...current,
        [id]: { x: center.x - NODE_WIDTH / 2, y: center.y },
      }))
      if (targetSchema === schema) {
        setSelectedId(id)
      } else {
        setPickedSchema(targetSchema)
      }
    }
    setTableRequest(null)
  }

  const {
    error: applyError,
    isPending: applying,
    mutate: apply,
    reset,
  } = useMutation({
    mutationFn: async (pending: DiagramDraft[]) => {
      const params = await connectionResourceToQueryParams(connectionResource)
      if (capabilities.ddlRollback) {
        await transaction(params).execute(async (tx) => {
          for (const draft of pending) {
            // oxlint-disable-next-line no-await-in-loop
            await draftQuery(draft).run(params, tx)
          }
        })
        return pending
      }
      const committed: DiagramDraft[] = []
      try {
        for (const draft of pending) {
          // oxlint-disable-next-line no-await-in-loop
          await draftQuery(draft).run(params)
          committed.push(draft)
        }
      } catch (error) {
        for (const draft of committed) {
          edit.remove(draft.id)
        }
        throw error
      }
      return pending
    },
    onSuccess: (applied) => {
      const renamed = Object.fromEntries(
        applied
          .filter((draft) => draft.kind === 'renameTable')
          .map((draft) => [
            tableNodeId(draft.schema, draft.table),
            tableNodeId(draft.schema, draft.newName),
          ])
      )
      commitPositions(
        Object.fromEntries(
          Object.entries(positions).map(([id, position]) => [
            renamed[id] ?? id,
            position,
          ])
        )
      )
      setDraggedPositions({})
      edit.clear()
      setReviewOpen(false)
      setSelectedId(null)
      toast.success(`Applied ${plural(applied.length, 'change')}`)
    },
    onError: () => setReviewOpen(true),
    onSettled: () => {
      void Promise.all([
        queryClient.invalidateQueries(
          resourceTablesAndSchemasQueryOptions({ connectionResource })
        ),
        queryClient.invalidateQueries({
          queryKey: resourceColumnsQueryKey({ connectionResource }),
        }),
        queryClient.invalidateQueries({
          queryKey: structureQueryKey(connectionResource),
        }),
      ])
    },
  })

  useSaveHotkey(() => apply(drafts), drafts.length === 0 || applying)
  useHotkey('Mod+F', () => searchRef.current?.focus(), { preventDefault: true })
  useHotkey(
    'Escape',
    () => {
      if (search) {
        setSearch('')
        return
      }
      searchRef.current?.blur()
    },
    { preventDefault: true, target: searchRef }
  )
  useHotkey(
    'Escape',
    (event) => {
      event.stopPropagation()
      setSelectedId(null)
    },
    {
      enabled:
        selectedId !== null && !tableRequest && !columnRequest && !reviewOpen,
    }
  )

  const context: DiagramContextValue = {
    actions,
    can,
    diagram,
    search: search.trim().toLowerCase(),
    selectedId,
    view: diagramViewStore(connectionResource.id),
  }

  return (
    <DiagramContext value={context}>
      <div className="relative flex size-full min-h-0 flex-1 overflow-hidden rounded-lg">
        <div className="relative min-w-0 flex-1">
          <Toolbar
            applying={applying}
            drafts={drafts}
            onApply={() => apply(drafts)}
            onReview={() => setReviewOpen(true)}
            onSchemaChange={(next) => {
              setPickedSchema(next)
              setSelectedId(null)
              setDraggedPositions({})
              setSearch('')
            }}
            onSearchChange={setSearch}
            schema={schema}
            schemas={schemas}
            search={search}
            searchRef={searchRef}
          />
          <Canvas
            key={schema}
            defaultViewport={store.get().visualizerViewports?.[schema]}
            positions={positions}
            onPositionsChange={setDraggedPositions}
            onPositionsCommit={() => commitPositions(positions)}
            onResetLayout={() => {
              setDraggedPositions(autoLayout)
              commitPositions(autoLayout)
              void flow.fitView({ ...fitViewOptions, duration: 300 })
            }}
            onViewportChange={(viewport) =>
              visualizerLayout.setViewport(
                connectionResource.id,
                schema,
                viewport
              )
            }
            onConnect={({ column, foreignColumn, foreignTable, table }) => {
              const source = diagram.tables.find((t) => t.id === table)
              const target = diagram.tables.find((t) => t.id === foreignTable)
              if (!source || !target) {
                return
              }
              edit.addForeignKey({
                columns: [column],
                foreignColumns: [foreignColumn],
                foreignSchema: target.schema,
                foreignTable: target.table,
                kind: 'addForeignKey',
                name: `${source.table}_${column}_fkey`,
                onDelete: 'NO ACTION',
                onUpdate: 'NO ACTION',
                schema: source.schema,
                table: source.table,
              })
            }}
          />
        </div>
        <AnimatePresence initial={false}>
          {selectedTable && (
            <motion.aside
              key="inspector"
              initial={{ width: 0 }}
              animate={{ width: INSPECTOR_WIDTH }}
              exit={{ width: 0 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="border-foreground/6 bg-background shrink-0 overflow-hidden border-l"
            >
              <div style={{ width: INSPECTOR_WIDTH }} className="h-full">
                <Inspector
                  key={selectedTable.id}
                  table={selectedTable}
                  indexes={indexes}
                  triggers={triggers}
                  policies={policies}
                  onClose={() => setSelectedId(null)}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      <TableDialog
        request={tableRequest}
        schemas={schemas}
        tableIds={tableIds}
        onOpenChange={(open) => !open && setTableRequest(null)}
        onSubmit={submitTable}
      />
      <ColumnDialog
        request={columnRequest}
        canRename={can.renameColumns}
        columnTypes={capabilities.columnTypes}
        onOpenChange={(open) => !open && setColumnRequest(null)}
        onSubmit={submitColumn}
      />
      <ReviewDrawer
        open={reviewOpen}
        onOpenChange={(open) => {
          setReviewOpen(open)
          if (!open) {
            reset()
          }
        }}
        connectionType={connection.type}
        ddlRollback={can.ddlRollback}
        drafts={drafts}
        error={applyError}
        applying={applying}
        onApply={() => apply(drafts)}
        onDiscard={(id) => edit.remove(id)}
        onDiscardAll={() => {
          edit.clear()
          setReviewOpen(false)
        }}
      />
    </DiagramContext>
  )
}

export const VisualizerTab = () => {
  const { connection, connectionResource } = useRouteContext()
  const { data: tables } = useQuery({
    ...resourceTablesAndSchemasQueryOptions({ connectionResource }),
    select: (data) =>
      data.schemas.flatMap(({ name, tables: entries }) =>
        entries.map((table) => ({
          schema: name,
          table: table.name,
          type: table.type,
        }))
      ),
  })
  const { data: columns } = useQuery(
    resourceColumnsQueryOptions({ connectionResource })
  )
  const { data: constraints } = useQuery(
    resourceConstraintsQueryOptions({ connectionResource })
  )

  if (!tables || !constraints || !columns) {
    return <VisualizerSkeleton />
  }

  return (
    <ReactFlowProvider key={connection.id}>
      <Visualizer tables={tables} columns={columns} constraints={constraints} />
    </ReactFlowProvider>
  )
}
