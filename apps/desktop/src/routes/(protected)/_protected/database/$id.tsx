import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { prefetchDatabaseCore, useDatabase } from '~/entities/database'
import { DatabaseSidebar } from './-components/database-sidebar'
import { PasswordForm } from './-components/password-form'

export const Route = createFileRoute('/(protected)/_protected/database/$id')({
  component: RouteComponent,
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
