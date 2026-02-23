import type { connectionResourceStoreType } from '~/entities/connection/store'
import type { FileRoutesById } from '~/routeTree.gen'
import { title } from '@conar/shared/utils/title'
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@conar/ui/components/resizable'
import { cn } from '@conar/ui/lib/utils'
import { createFileRoute, Outlet, redirect, useMatches } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { QueryLogger } from '~/entities/connection/components'
import { connectionResourceStore } from '~/entities/connection/store'
import { connectionsCollection, connectionsResourcesCollection } from '~/entities/connection/sync'
import { lastOpenedResources, prefetchConnectionResourceCore } from '~/entities/connection/utils'
import { ConnectionSidebar } from './-components/connection-sidebar'
import { PasswordForm } from './-components/password-form'

export const Route = createFileRoute('/_protected/connection/$resourceId')({
  component: DatabasePage,
  beforeLoad: async ({ params }) => {
    const connectionResource = connectionsResourcesCollection.get(params.resourceId)

    if (!connectionResource) {
      throw redirect({ to: '/' })
    }

    const connection = connectionsCollection.get(connectionResource.connectionId)

    if (!connection) {
      throw redirect({ to: '/' })
    }

    return { connection, connectionResource }
  },
  loader: async ({ context }) => {
    prefetchConnectionResourceCore(context.connectionResource)

    return { connection: context.connection }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: title(loaderData.connection.name) }]
      : [],
  }),
})

function getDatabasePageId(routesIds: (keyof FileRoutesById)[]) {
  return routesIds.find(route => route.includes('/_protected/connection/$resourceId')) as typeof connectionResourceStoreType.infer['lastOpenedPage']
}

function DatabasePage() {
  const { connection, connectionResource } = Route.useRouteContext()
  const currentPageId = useMatches({
    select: matches => getDatabasePageId(matches.map(match => match.routeId)),
  })
  const store = connectionResourceStore(connectionResource.id)
  const loggerOpened = useStore(store, state => state.loggerOpened)

  useEffect(() => {
    if (currentPageId) {
      store.setState(state => ({
        ...state,
        lastOpenedPage: currentPageId,
      } satisfies typeof state))
    }
  }, [currentPageId, store])

  useEffect(() => {
    const last = lastOpenedResources.get()
    if (!last.includes(connectionResource.id))
      lastOpenedResources.set([connectionResource.id, ...last.filter(resourceId => resourceId !== connectionResource.id)].slice(0, 3))
  }, [connectionResource.id])

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: `database-layout-${connectionResource.id}`,
    storage: localStorage,
  })

  if (connection.isPasswordExists && !connection.isPasswordPopulated) {
    return <PasswordForm connection={connection} connectionResource={connectionResource} />
  }

  return (
    <div className={`
      flex bg-gray-100
      dark:bg-neutral-950/60
    `}
    >
      <ConnectionSidebar className="w-16" />
      <div
        className={cn(
          `
            m-2 ml-0 flex h-[calc(100%-(--spacing(4)))]
            w-[calc(100%-(--spacing(16))-(--spacing(2)))] flex-col
          `,
        )}
      >
        <ResizablePanelGroup
          orientation="vertical"
          className="min-h-0 flex-1"
          defaultLayout={defaultLayout}
          onLayoutChanged={onLayoutChanged}
        >
          <ResizablePanel defaultSize="70%" minSize="50%">
            <Outlet />
          </ResizablePanel>
          {loggerOpened && (
            <>
              <ResizableSeparator className="h-1" />
              <ResizablePanel
                defaultSize="30%"
                minSize="10%"
                maxSize="50%"
                className="overflow-auto rounded-lg border bg-background"
              >
                <QueryLogger connectionResource={connectionResource} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
