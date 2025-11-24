import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { createFileRoute, Outlet, redirect, useMatches } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect } from 'react'
import {
  databasesCollection,
  lastOpenedDatabases,
  prefetchDatabaseCore,
} from '~/entities/database'
import { QueryLogger } from '~/entities/database/components/query-logger'
import { DatabaseSidebar } from './-components/database-sidebar'
import { PasswordForm } from './-components/password-form'
import { databaseStore, getDatabasePageId } from './-store'

export const Route = createFileRoute('/(protected)/_protected/database/$id')({
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

  if (database.isPasswordExists && !database.isPasswordPopulated) {
    return <PasswordForm database={database} />
  }

  return (
    <div className="flex bg-gray-100 dark:bg-neutral-950/60">
      <DatabaseSidebar className="w-16" />
      <div className="h-[calc(100%-(--spacing(4)))] w-[calc(100%-(--spacing(16))-(--spacing(2)))] m-2 ml-0 flex flex-col">
        <ResizablePanelGroup
          direction="vertical"
          className="flex-1 min-h-0"
          autoSaveId={`logger-layout-${database.id}`}
        >
          <ResizablePanel defaultSize={70} minSize={50}>
            <Outlet />
          </ResizablePanel>
          {loggerOpened && (
            <>
              <ResizableHandle className="h-1! bg-body" />
              <ResizablePanel defaultSize={30} minSize={10} maxSize={50} className="border overflow-auto rounded-lg bg-background">
                <QueryLogger database={database} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
