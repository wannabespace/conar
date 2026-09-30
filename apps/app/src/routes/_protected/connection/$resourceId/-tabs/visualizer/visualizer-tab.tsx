import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { ReactFlowProvider } from '@xyflow/react'
import { useSubscription } from 'seitu/react'

import { capabilitiesOf } from '~/entities/connection/capabilities'
import { TableError } from '~/entities/connection/components/table/table-error'
import { resourceConstraintsQueryOptions } from '~/entities/connection/queries/constraints/list'
import { resourceColumnsQueryOptions } from '~/entities/connection/queries/tables/columns'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'

import { Visualizer } from './-components/visualizer'
import { diagramDraftsStore } from './-lib/drafts'
import { VisualizerSkeleton } from './visualizer-skeleton'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const VisualizerTab = () => {
  const { connection, connectionResource } = useRouteContext()
  const { data: tables, error: tablesError } = useQuery({
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
  const { data: columns, error: columnsError } = useQuery(
    resourceColumnsQueryOptions({ connectionResource })
  )
  const { data: constraints, error: constraintsError } = useQuery(
    resourceConstraintsQueryOptions({ connectionResource })
  )

  const hasDrafts = useSubscription(diagramDraftsStore(connectionResource.id), {
    selector: (state) => state.drafts.length > 0,
  })

  if (!tables || !constraints || !columns) {
    const error = tablesError ?? columnsError ?? constraintsError
    if (error) {
      return <TableError error={error} />
    }
    return (
      <VisualizerSkeleton
        drafts={hasDrafts}
        schemaPicker={
          capabilitiesOf(connection.type).schemas &&
          (!tables || new Set(tables.map(({ schema }) => schema)).size > 1)
        }
      />
    )
  }

  return (
    <ReactFlowProvider key={connection.id}>
      <Visualizer tables={tables} columns={columns} constraints={constraints} />
    </ReactFlowProvider>
  )
}
