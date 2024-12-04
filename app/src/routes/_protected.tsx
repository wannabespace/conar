import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { useSession } from '~/hooks/use-session'
import { authClient } from '~/lib/auth'
import { BEARER_TOKEN_KEY } from '~/lib/constants'
import { queryClient } from '~/main'
import { sessionQuery } from '~/query/auth'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    const { data } = await queryClient.ensureQueryData(sessionQuery())

    if (!data?.session) {
      throw redirect({
        to: '/sign-in',
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { isLoading, session, refetch } = useSession()

  return (
    <>
      <div className="flex gap-2 p-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        {' '}
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
        <Link to="/dashboard" className="[&.active]:font-bold">
          Dashboard
        </Link>
      </div>
      <hr />
      <header>
        {isLoading ? 'Loading...' : session?.user.email || 'No user'}
      </header>
      <button
        onClick={async () => {
          await authClient.signOut()
          localStorage.removeItem(BEARER_TOKEN_KEY)
          await refetch()
        }}
      >
        Sign Out
      </button>
      <Outlet />
    </>
  )
}
