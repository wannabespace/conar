import { title } from '@conar/shared/utils/title'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@conar/ui/components/resizable'
import { cn } from '@conar/ui/lib/utils'
import { createFileRoute, Outlet, redirect, useMatches } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect } from 'react'
import {
  databasesCollection,
  databaseStore,
  getDatabasePageId,
  lastOpenedDatabases,
  prefetchDatabaseCore,
} from '~/entities/database'
import { QueryLogger } from '~/entities/database/components/query-logger'
import { DatabaseSidebar } from './-components/database-sidebar'
import { PasswordForm } from './-components/password-form'

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
  const { loggerOpened, sidebarVisible } = useStore(store, state => ({
    loggerOpened: state.loggerOpened,
    sidebarVisible: state.layout.sidebarVisible,
  }))

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
    <div className={`
      flex bg-gray-100
      dark:bg-neutral-950/60
    `}
    >
      <DatabaseSidebar
        className={cn(
          'w-16 transition-all duration-200',
          {
            'w-0 overflow-hidden opacity-0': !sidebarVisible,
          },
        )}
      />
      <div
        className={cn(
          'm-2 flex flex-col transition-all duration-200',
          {
            'ml-0 h-[calc(100%-(--spacing(4)))] w-[calc(100%-(--spacing(16))-(--spacing(2)))]': sidebarVisible,
            'h-[calc(100%-(--spacing(4)))] w-[calc(100%-(--spacing(4)))]': !sidebarVisible,
          },
        )}
      >
        <ResizablePanelGroup
          direction="vertical"
          className="min-h-0 flex-1"
          autoSaveId={`logger-layout-${database.id}`}
        >
          <ResizablePanel defaultSize={70} minSize={50}>
            <Outlet />
          </ResizablePanel>
          {loggerOpened && (
            <>
              <ResizableHandle className="bg-body h-1!" />
              <ResizablePanel
                defaultSize={30}
                minSize={10}
                maxSize={50}
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
