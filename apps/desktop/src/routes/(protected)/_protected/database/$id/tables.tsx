import type { ComponentRef } from 'react'
import type { TablesTabs } from './-components/tabs'
import { title } from '@connnect/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@connnect/ui/components/resizable'
import { createFileRoute, Outlet, useParams } from '@tanstack/react-router'
import { useRef } from 'react'
import { useDatabase } from '~/entities/database'
import { Sidebar } from './-components/sidebar'

export const Route = createFileRoute(
  '/(protected)/_protected/database/$id/tables',
)({
  component: DatabaseTablesPage,
  loader: ({ context }) => ({ database: context.database }),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: title('Tables', loaderData.database.name),
          },
        ]
      : [],
  }),
})

function Content({ id: _id }: { id: string }) {
  const { schema: schemaParam, table: tableParam } = useParams({ strict: false })
  const tabsRef = useRef<ComponentRef<typeof TablesTabs>>(null)
  // const { data: database } = useDatabase(id)

  if (!schemaParam || !tableParam) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="text-lg font-medium">
            No table selected
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Select a schema from the dropdown and choose a table from the sidebar to view and manage your data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* <TablesTabs
        ref={tabsRef}
        database={database}
        id={id}
      /> */}
      <div
        key={tableParam}
        className="h-[calc(100%-theme(spacing.9))]"
        onClick={() => tabsRef.current?.ensureTab(schemaParam, tableParam)}
      >
        <Outlet />
      </div>
    </>
  )
}

function DatabaseTablesPage() {
  const { id } = Route.useParams()
  const { data: database } = useDatabase(id)

  return (
    <ResizablePanelGroup autoSaveId={`database-layout-${id}`} direction="horizontal" className="flex">
      <ResizablePanel
        defaultSize={20}
        minSize={10}
        maxSize={50}
        className="flex flex-col h-full border bg-background rounded-lg"
      >
        <Sidebar database={database} />
      </ResizablePanel>
      <ResizableHandle className="w-2 bg-transparent" />
      <ResizablePanel defaultSize={80} className="flex-1 border bg-background rounded-lg">
        <Content id={id} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
