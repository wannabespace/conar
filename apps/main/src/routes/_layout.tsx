import { createFileRoute, Outlet } from '@tanstack/react-router'

import { Footer } from '~/components/footer'
import { Navbar } from '~/components/navbar'
import { getOSIsomorphic } from '~/utils/os'

const MainLayout = () => (
  <div className="flex min-h-dvh flex-col overflow-x-clip">
    <Navbar />
    <div className="flex-1">
      <Outlet />
    </div>
    <Footer />
  </div>
)

export const Route = createFileRoute('/_layout')({
  component: MainLayout,
  loader: () => getOSIsomorphic(),
})
