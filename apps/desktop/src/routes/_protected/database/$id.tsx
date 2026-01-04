import type { databaseStoreType } from '~/entities/database/store'
import type { FileRoutesById } from '~/routeTree.gen'
import { title } from '@conar/shared/utils/title'
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@conar/ui/components/resizable'
import { cn } from '@conar/ui/lib/utils'
import { createFileRoute, Outlet, redirect, useMatches } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect } from 'react'
import { useDefaultLayout } from 'react-resizable-panels'
import { QueryLogger } from '~/entities/database/components'
import { databaseStore } from '~/entities/database/store'
import { databasesCollection } from '~/entities/database/sync'
import { lastOpenedDatabases, prefetchDatabaseCore } from '~/entities/database/utils'
import { DatabaseSidebar } from './-components/database-sidebar'
import { PasswordForm } from './-components/password-form'

export const Route = createFileRoute('/_protected/database/$id')({
  component: DatabasePage,
  beforeLoad: async ({ params }) => {
    const database = databasesCollection.get(params.id)

    if (!database) {
      throw redirect({ to: '/' })
    }

    return { database }
  },
  loader: async ({ context }) => {
    prefetchDatabaseCore(context.database)

    return { database: context.database }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title(loaderData.database.name) }] : [],
  }),
})

function getDatabasePageId(routesIds: (keyof FileRoutesById)[]) {
  return routesIds.find(route => route.includes('/_protected/database/$id/')) as typeof databaseStoreType.infer['lastOpenedPage']
}

function DatabasePage() {
  const { database } = Route.useLoaderData()
  const currentPageId = useMatches({
    select: matches => getDatabasePageId(matches.map(match => match.routeId)),
  })
  const store = databaseStore(database.id)
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
    const last = lastOpenedDatabases.get()
    if (!last.includes(database.id))
      lastOpenedDatabases.set([database.id, ...last.filter(dbId => dbId !== database.id)].slice(0, 3))
  }, [database.id])

  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    id: `logger-layout-${database.id}`,
    storage: localStorage,
  })

  if (database.isPasswordExists && !database.isPasswordPopulated) {
    return <PasswordForm database={database} />
  }

  return (
    <div className={`
      flex bg-gray-100
      dark:bg-neutral-950/60
    `}
    >
      <DatabaseSidebar className="w-16" />
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
          onLayoutChange={onLayoutChange}
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
                <QueryLogger database={database} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
