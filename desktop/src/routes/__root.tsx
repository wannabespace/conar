import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Outlet } from '@tanstack/react-router'
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
  const { refetch } = useSession()

  useEffect(() => {
    authClient.$store.listen('$sessionSignal', refetch)
  }, [])

  useEffect(() => {
    onOpenUrl(async ([url]) => {
      const [, token] = (url || '').split('session?token=')

      if (token) {
        localStorage.setItem(BEARER_TOKEN_KEY, token)
        await refetch()
      }
    })
  }, [])

  return (
    <ThemeProvider>
      <Outlet />
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools />
          <ReactQueryDevtools initialIsOpen={false} />
        </>
      )}
    </ThemeProvider>
  )
}
