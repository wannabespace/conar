import { BlurGradient } from '@conar/ui/components/custom/blur-gradient'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Footer } from '~/components/footer'
import { Navbar } from '~/components/navbar'

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <BlurGradient className="fixed z-40 inset-x-0 top-0 h-[200px]" />
      <BlurGradient className="fixed z-40 inset-x-0 bottom-0 rotate-180 h-[200px]" />
      <Navbar />
      <Outlet />
      <Footer />
    </>
  )
}
