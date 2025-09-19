import { title } from '@conar/shared/utils/title'
import { createFileRoute, Outlet, redirect, useMatches } from '@tanstack/react-router'
import { useEffect } from 'react'
import {
  databasesCollection,
  getDatabasePageId,
  lastOpenedDatabases,
  lastOpenedPage,
  prefetchDatabaseCore,
} from '~/entities/database'
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

  useEffect(() => {
    if (currentPageId) {
      lastOpenedPage(database.id).set(currentPageId)
    }
  }, [currentPageId, database.id])

  useEffect(() => {
    const last = lastOpenedDatabases.get()
    if (!last.includes(database.id))
      lastOpenedDatabases.set([database.id, ...last.filter(dbId => dbId !== database.id)].slice(0, 3))
  }, [database.id])

  if (database.isPasswordExists && !database.isPasswordPopulated) {
    return <PasswordForm database={database} />
  }

  return (
    <div className="min-h-[inherit] h-screen flex bg-gray-100 dark:bg-neutral-950/60">
      <DatabaseSidebar className="w-16" />
      <div className="h-[calc(100%-theme(spacing.4))] w-[calc(100%-theme(spacing.16)-theme(spacing.2))] m-2 ml-0">
        <Outlet />
      </div>
    </div>
  )
}
