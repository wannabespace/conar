import { title } from '@connnect/shared/utils/title'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { databaseQuery, prefetchDatabaseCore, useDatabase } from '~/entities/database'
import { queryClient } from '~/main'
import { DatabaseSidebar } from './-components/database-sidebar'
import { PasswordForm } from './-components/password-form'

export const Route = createFileRoute('/(protected)/_protected/database/$id')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const database = await queryClient.ensureQueryData(databaseQuery(params.id))
    return { database }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: title(loaderData.database.name),
      },
    ],
  }),
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: database } = useDatabase(id)

  useEffect(() => {
    prefetchDatabaseCore(database)
  }, [database])

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
