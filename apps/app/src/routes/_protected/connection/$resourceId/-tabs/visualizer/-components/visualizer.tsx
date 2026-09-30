import { useHotkey } from '@tanstack/react-hotkeys'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useReactFlow } from '@xyflow/react'
import { useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import {
  capabilitiesOf,
  defaultSchemaOf,
} from '~/entities/connection/capabilities'
import type { constraintsType } from '~/entities/connection/queries/constraints/list'
import { resourceIndexesQueryOptions } from '~/entities/connection/queries/indexes/list'
import { resourcePoliciesQueryOptions } from '~/entities/connection/queries/policies/list'
import type { columnType } from '~/entities/connection/queries/tables/columns'
import { resourceTriggersQueryOptions } from '~/entities/connection/queries/triggers/list'
import { visualizerLayout } from '~/entities/connection/store/helpers/visualizer'
import { getConnectionResourceStore } from '~/entities/connection/store/stores'

import { useDiagramActions } from '../-lib/actions'
import { useApplyDrafts } from '../-lib/apply'
import type { DiagramContextValue } from '../-lib/context'
import { DiagramContext, diagramViewStore, gatesOf } from '../-lib/context'
import { diagramDrafts, diagramDraftsStore } from '../-lib/drafts'
import { usePositions } from '../-lib/layout'
import type { TableKind } from '../-lib/schema'
import { buildDiagram, tableNodeId } from '../-lib/schema'
import { Canvas, fitViewOptions } from './canvas'
import type { ColumnDialogRequest } from './column-dialog'
import { ColumnDialog } from './column-dialog'
import { InspectorPane } from './inspector'
import { ReviewDrawer } from './review-drawer'
import type { TableDialogRequest } from './table-dialog'
import { TableDialog } from './table-dialog'
import { Toolbar } from './toolbar'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const noRows: never[] = []

export const Visualizer = ({
  columns,
  constraints,
  tables,
}: {
  columns: (typeof columnType.infer)[]
  constraints: (typeof constraintsType.infer)[]
  tables: { schema: string; table: string; type: TableKind }[]
}) => {
  const { connection, connectionResource } = useRouteContext()
  const flow = useReactFlow()
  const draftsStore = diagramDraftsStore(connectionResource.id)
  const drafts = useSubscription(draftsStore, {
    isEqual: Object.is,
    selector: (state) => state.drafts,
  })
  const edit = diagramDrafts(draftsStore)
  const can = gatesOf(connection.type)

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
  const layout = usePositions(connectionResource.id, schema, diagram)

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

  const { actions, submitColumn, submitTable } = useDiagramActions({
    constraints,
    diagram,
    drafts,
    edit,
    schema,
    setColumnRequest,
    setDragged: layout.setDragged,
    setPickedSchema,
    setSelectedId,
    setTableRequest,
  })

  const apply = useApplyDrafts({
    drafts,
    edit,
    onApplied: (applied) => {
      layout.settle(applied)
      setSelectedId(null)
    },
    reviewOpen,
    setReviewOpen,
  })

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
            applying={apply.applying}
            drafts={drafts}
            onApply={() => apply.request()}
            onReview={() => setReviewOpen(true)}
            onSchemaChange={(next) => {
              setPickedSchema(next)
              setSelectedId(null)
              layout.setDragged({})
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
            defaultViewport={
              getConnectionResourceStore(connectionResource.id).get()
                .visualizerViewports?.[schema]
            }
            positions={layout.positions}
            onPositionsChange={(next) => layout.setDragged(next)}
            onPositionsCommit={() => layout.commit(layout.positions)}
            onResetLayout={() => {
              layout.setDragged(layout.auto)
              layout.commit(layout.auto)
              void flow.fitView({ ...fitViewOptions, duration: 300 })
            }}
            onViewportChange={(viewport) =>
              visualizerLayout.setViewport(
                connectionResource.id,
                schema,
                viewport
              )
            }
          />
        </div>
        <InspectorPane
          table={selectedTable}
          indexes={indexes}
          triggers={triggers}
          policies={policies}
          onClose={() => setSelectedId(null)}
        />
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
        columnTypes={capabilitiesOf(connection.type).columnTypes}
        onOpenChange={(open) => !open && setColumnRequest(null)}
        onSubmit={submitColumn}
      />
      <ReviewDrawer
        open={reviewOpen}
        onOpenChange={(open) => {
          setReviewOpen(open)
          if (!open) {
            apply.reset()
          }
        }}
        connectionType={connection.type}
        ddlRollback={can.ddlRollback}
        drafts={drafts}
        error={apply.error}
        applying={apply.applying}
        onApply={() => apply.request()}
        onDiscard={(id) => edit.remove(id)}
        onDiscardAll={() => {
          edit.clear()
          setReviewOpen(false)
        }}
      />
    </DiagramContext>
  )
}
