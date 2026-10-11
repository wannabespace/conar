import { createFileRoute, Outlet } from '@tanstack/react-router'

import { Footer } from '~/components/footer'
import { Navbar } from '~/components/navbar'

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
})
