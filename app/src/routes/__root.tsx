import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Link, Outlet, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { useSession } from '~/hooks/use-session'
import { authClient } from '~/lib/auth'
import { BEARER_TOKEN_KEY } from '~/lib/constants'
import { ThemeProvider } from '~/theme-provider'

export const Route = createRootRoute({
  component: Root,
})

function Root() {
  const { isLoading, data, refetch } = useSession()
  const router = useRouter()

  async function updateSession() {
    await refetch()
    await router.invalidate()
  }

  useEffect(() => {
    authClient.$store.listen('$sessionSignal', updateSession)
  }, [])

  useEffect(() => {
    onOpenUrl(async ([url]) => {
      const [, token] = (url || '').split('session?token=')

      if (token) {
        localStorage.setItem(BEARER_TOKEN_KEY, token)
        await updateSession()
      }
    })
  }, [])

  return (
    <ThemeProvider>
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
        {isLoading ? 'Loading...' : data?.data?.user.email || 'No user'}
      </header>
      <button
        onClick={async () => {
          await authClient.signOut()
          localStorage.removeItem(BEARER_TOKEN_KEY)
          await updateSession()
        }}
      >
        Sign Out
      </button>
      <Outlet />
      <TanStackRouterDevtools />
      <ReactQueryDevtools initialIsOpen={false} />
    </ThemeProvider>
  )
}
