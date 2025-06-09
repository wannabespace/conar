import { title } from '@conar/shared/utils/title'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { databaseQuery, prefetchDatabaseCore, useDatabase } from '~/entities/database'
import { queryClient } from '~/main'
import { DatabaseSidebar } from './-components/database-sidebar'
import { PasswordForm } from './-components/password-form'

export const Route = createFileRoute('/(protected)/_protected/database/$id')({
  component: DatabasePage,
  beforeLoad: async ({ params }) => {
    const database = await queryClient.ensureQueryData(databaseQuery(params.id))

    prefetchDatabaseCore(database)

    return { database }
  },
  loader: ({ context }) => ({ database: context.database }),
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
  const { id } = Route.useParams()
  const { data: database } = useDatabase(id)

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
