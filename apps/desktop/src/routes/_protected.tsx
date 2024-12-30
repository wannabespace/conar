import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { useSession } from '~/hooks/use-session'
import { authClient, removeBearerToken } from '~/lib/auth'
import { queryClient } from '~/main'
import { sessionQuery } from '~/queries/auth'

export const Route = createFileRoute('/_protected')({
  component: LayoutComponent,
  beforeLoad: async () => {
    const data = await queryClient.ensureQueryData(sessionQuery)

    if (!data.data?.session) {
      throw redirect({ to: '/sign-in' })
    }
  },
})

function LayoutComponent() {
  const { isLoading, data, refetch } = useSession()

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
        type="button"
        onClick={async () => {
          await Promise.all([authClient.signOut(), removeBearerToken()])
          await refetch()
        }}
      >
        Sign Out
      </button>
      <Outlet />
    </>
  )
}
