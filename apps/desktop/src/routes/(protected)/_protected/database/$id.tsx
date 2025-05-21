import { title } from '@connnect/shared/utils/title'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { databaseQuery, ensureDatabaseCore, useDatabase } from '~/entities/database'
import { queryClient } from '~/main'
import { DatabaseSidebar } from './-components/database-sidebar'
import { PasswordForm } from './-components/password-form'

export const Route = createFileRoute('/(protected)/_protected/database/$id')({
  component: DatabasePage,
  beforeLoad: async ({ params }) => {
    const database = await queryClient.ensureQueryData(databaseQuery(params.id))

    ensureDatabaseCore(database)

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
    <>
      <DatabaseSidebar />
      <Outlet />
    </>
  )
}
