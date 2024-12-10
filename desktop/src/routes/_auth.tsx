import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppLogo } from 'shared/components'
import { Card, CardContent, CardHeader, CardTitle } from 'shared/ui'
import { queryClient } from '~/main'
import { sessionQuery } from '~/query/auth'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { data } = await queryClient.ensureQueryData(sessionQuery())

    if (data?.session) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex min-h-screen py-10">
      <Card className="m-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-5">
            <AppLogo className="size-16" />
            <h1 className="text-2xl font-semibold">Login to Connnect</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Outlet />
        </CardContent>
      </Card>
    </div>
  )
}
