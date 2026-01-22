'use no memo'
import type { connectionStoreType } from '~/entities/connection/store'
import type { FileRoutesById } from '~/routeTree.gen'
import { title } from '@conar/shared/utils/title'
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@conar/ui/components/resizable'
import { cn } from '@conar/ui/lib/utils'
import { createFileRoute, Outlet, redirect, useMatches } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { QueryLogger } from '~/entities/connection/components'
import { connectionStore } from '~/entities/connection/store'
import { connectionsCollection } from '~/entities/connection/sync'
import { lastOpenedConnections, prefetchConnectionCore } from '~/entities/connection/utils'
import { ConnectionSidebar } from './-components/connection-sidebar'
import { PasswordForm } from './-components/password-form'

export const Route = createFileRoute('/_protected/database/$id')({
  component: DatabasePage,
  beforeLoad: async ({ params }) => {
    const connection = connectionsCollection.get(params.id)

    if (!connection) {
      throw redirect({ to: '/' })
    }

    return { connection }
  },
  loader: async ({ context }) => {
    prefetchConnectionCore(context.connection)

    return { connection: context.connection }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title(loaderData.connection.name) }] : [],
  }),
})

function getDatabasePageId(routesIds: (keyof FileRoutesById)[]) {
  return routesIds.find(route => route.includes('/_protected/database/$id/')) as typeof connectionStoreType.infer['lastOpenedPage']
}

function DatabasePage() {
  const { connection } = Route.useLoaderData()
  const currentPageId = useMatches({
    select: matches => getDatabasePageId(matches.map(match => match.routeId)),
  })
  const store = connectionStore(connection.id)
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
    const last = lastOpenedConnections.get()
    if (!last.includes(connection.id))
      lastOpenedConnections.set([connection.id, ...last.filter(connId => connId !== connection.id)].slice(0, 3))
  }, [connection.id])

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: `database-layout-${connection.id}`,
    storage: localStorage,
  })

  if (connection.isPasswordExists && !connection.isPasswordPopulated) {
    return <PasswordForm connection={connection} />
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
                <QueryLogger connection={connection} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
