import { createFileRoute, Link, Outlet, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useSession } from '~/hooks/use-session'
import { authClient } from '~/lib/auth'

export const Route = createFileRoute('/_layout/_protected')({
  component: LayoutComponent,
})

function LayoutComponent() {
  const { isLoading, data, refetch } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!data && !isLoading) {
      router.navigate({ to: '/sign-in' })
    }
  }, [data, isLoading])

  return (
    <>
      <div className="flex gap-2 p-2">
        <Link to="/" className="[&.active]:font-bold">
          Dashboard
        </Link>
      </div>
      <hr />
      <header>
        {isLoading ? 'Loading...' : data?.user.email || 'No user'}
      </header>
      <button
        onClick={async () => {
          await authClient.signOut()
          await refetch()
        }}
      >
        Sign Out
      </button>
      <Outlet />
    </>
  )
}
