import type { QueryClient } from '@tanstack/react-query'
import { ThemeProvider } from '@connnect/ui/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AuthProvider } from '~/auth-provider'
import { sessionQuery } from '~/queries/auth'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootDocument,
  beforeLoad: async ({ context: { queryClient } }) => {
    await queryClient.prefetchQuery(sessionQuery)
  },
})

function RootDocument() {
  const { queryClient } = Route.useRouteContext()

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Outlet />
          <ReactQueryDevtools />
          <TanStackRouterDevtools />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
