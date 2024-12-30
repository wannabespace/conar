import { ThemeProvider } from '@connnect/ui/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useEffect } from 'react'
import { AuthProvider } from '~/auth-provider'
import { queryClient } from '~/main'

export const Route = createRootRoute({
  component: RootDocument,
})

function RootDocument() {
  useEffect(() => {

  }, [])

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Outlet />
          {import.meta.env.DEV && (
            <>
              <TanStackRouterDevtools />
              <ReactQueryDevtools initialIsOpen={false} />
            </>
          )}
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
