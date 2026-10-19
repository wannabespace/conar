import { createFileRoute, Outlet } from '@tanstack/react-router'

import { Footer } from '~/components/footer'
import { Navbar } from '~/components/navbar'
import { getOSIsomorphic } from '~/utils/os'

const MainLayout = () => (
  <div className="overflow-x-clip">
    <div className="bg-body ring-foreground/4 relative z-10 flex min-h-dvh flex-col rounded-b-4xl shadow-md ring">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
    <Footer />
  </div>
)

export const Route = createFileRoute('/_layout')({
  component: MainLayout,
  loader: () => getOSIsomorphic(),
})
