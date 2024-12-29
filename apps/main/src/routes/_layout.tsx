import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AuthProvider } from '../auth-provider'

export const Route = createFileRoute('/_layout')({
  component: () => (
    <>
      <AuthProvider>
        <Outlet />
        <TanStackRouterDevtools />
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </>
  ),
})
