import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useReactFlow } from '@xyflow/react'
import type { Dispatch, SetStateAction } from 'react'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import type { constraintsType } from '~/core/queries/constraints/list'
import type { NewColumn } from '~/core/queries/tables/shape'
import type { ColumnDialogRequest } from '~/core/table/column-dialog'
import type { TableDialogRequest } from '~/core/table/table-dialog'
import { openTab } from '~/core/tabs/actions'
import { tableTabId } from '~/core/tabs/ids'
import { openNewWindow } from '~/lib/new-window'

import type { DiagramActions } from './context'
import type { diagramDrafts } from './drafts'
import { NODE_WIDTH } from './layout'
import { visualizerLayout } from './positions'
import type { Diagram, DiagramColumn, DiagramTable } from './schema'
import { tableNodeId } from './schema'
import type { DiagramDraft } from './statements'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const freeName = (base: string, taken: Set<string>) => {
  let name = base
  for (let suffix = 2; taken.has(name); suffix += 1) {
    name = `${base}_${suffix}`
  }
  return name
}

export const useDiagramActions = ({
  constraints,
  diagram,
  drafts,
  edit,
  schema,
  setColumnRequest,
  setPickedSchema,
  setSelectedId,
  setTableRequest,
}: {
  constraints: (typeof constraintsType.infer)[]
  diagram: Diagram
  drafts: DiagramDraft[]
  edit: ReturnType<typeof diagramDrafts>
  schema: string
  setColumnRequest: (
    request: ColumnDialogRequest<DiagramTable, DiagramColumn> | null
  ) => void
  setPickedSchema: (schema: string) => void
  setSelectedId: Dispatch<SetStateAction<string | null>>
  setTableRequest: (request: TableDialogRequest<DiagramTable> | null) => void
}) => {
  const { connection, connectionResource } = useRouteContext()
  const router = useRouter()
  const flow = useReactFlow()

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
      void flow.fitView({
        duration: 300,
        maxZoom: 1,
        nodes: [{ id: relation.source.table }, { id: relation.target.table }],
        padding: 0.2,
      })
    },
    linkColumns: ({ column, foreignColumn, foreignTable, table }) => {
      const source = diagram.tables.find((t) => t.id === table)
      const target = diagram.tables.find((t) => t.id === foreignTable)
      if (!source || !target) {
        return
      }
      const taken = new Set([
        ...constraints
          .filter((c) => c.schema === source.schema)
          .map((c) => c.name),
        ...drafts.flatMap((draft) =>
          draft.kind === 'addForeignKey' ? [draft.name] : []
        ),
      ])
      edit.addForeignKey({
        columns: [column],
        foreignColumns: [foreignColumn],
        foreignSchema: target.schema,
        foreignTable: target.table,
        kind: 'addForeignKey',
        name: freeName(`${source.table}_${column}_fkey`, taken),
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
        schema: source.schema,
        table: source.table,
      })
    },
    openTable: (table, newWindow) => {
      openTab(connectionResource.id, tableTabId(table.schema, table.table))
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
        column.original
      ),
  }

  const submitColumn = (
    { column, table }: ColumnDialogRequest<DiagramTable, DiagramColumn>,
    next: NewColumn
  ) => {
    if (column === null) {
      edit.addColumn(table, next)
    } else {
      if (next.name !== column.name) {
        edit.renameColumn(table, column.id, next.name)
      }
      if (next.type !== column.type || next.nullable !== column.nullable) {
        const id = column.state === 'added' ? next.name : column.id
        edit.alterColumn(
          table,
          id,
          { nullable: next.nullable, type: next.type },
          column.original
        )
      }
    }
    setColumnRequest(null)
  }

  const submitTable = (
    { table }: TableDialogRequest<DiagramTable>,
    targetSchema: string,
    name: string
  ) => {
    if (table) {
      edit.renameTable(table, name)
      if (table.state === 'added') {
        const renamedId = tableNodeId(table.schema, name)
        visualizerLayout.moveTable(
          connectionResource.id,
          table.schema,
          table.id,
          renamedId
        )
        setSelectedId((current) => (current === table.id ? renamedId : current))
      }
    } else {
      edit.createTable({ schema: targetSchema, table: name }, [
        {
          name: 'id',
          nullable: false,
          primaryKey: true,
          type: capabilitiesOf(connection.type).idColumnType,
        },
      ])
      const id = tableNodeId(targetSchema, name)
      const center = flow.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })
      visualizerLayout.setPositions(
        connectionResource.id,
        targetSchema,
        (positions) => ({
          ...positions,
          [id]: { x: center.x - NODE_WIDTH / 2, y: center.y },
        })
      )
      if (targetSchema === schema) {
        setSelectedId(id)
      } else {
        setPickedSchema(targetSchema)
      }
    }
    setTableRequest(null)
  }

  return { actions, submitColumn, submitTable }
}
