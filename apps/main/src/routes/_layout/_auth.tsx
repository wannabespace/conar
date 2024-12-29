import { Card, CardContent, CardHeader, CardTitle } from '@connnect/ui/components/card'
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { AppLogo } from '~/components/app-logo'
import { useSession } from '~/hooks/use-session'

export const Route = createFileRoute('/_layout/_auth')({
  component: LayoutComponent,
})

function LayoutComponent() {
  const { data, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (data && !isLoading) {
      router.navigate({ to: '/' })
    }
  }, [data, isLoading])

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
