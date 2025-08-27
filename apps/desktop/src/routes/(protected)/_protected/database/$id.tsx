import { title } from '@conar/shared/utils/title'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ensureDatabase, prefetchDatabaseCore } from '~/entities/database'
import { DatabaseSidebar } from './-components/database-sidebar'
import { PasswordForm } from './-components/password-form'
import { lastOpenedDatabases } from './-lib'

export const Route = createFileRoute('/(protected)/_protected/database/$id')({
  component: DatabasePage,
  beforeLoad: async ({ params }) => {
    const database = await ensureDatabase(params.id)

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
    meta: loaderData
      ? [
          {
            title: title(loaderData.database.name),
          },
        ]
      : [],
  }),
})

function DatabasePage() {
  const { database } = Route.useLoaderData()

  useEffect(() => {
    if (!lastOpenedDatabases.get().includes(database.id))
      lastOpenedDatabases.set([database.id, ...lastOpenedDatabases.get().filter(dbId => dbId !== database.id)].slice(0, 3))
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
