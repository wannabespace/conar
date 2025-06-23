import { BlurGradient } from '@conar/ui/components/custom/blur-gradient'
import { useElementSize } from '@conar/ui/hookas/use-element-size'
import { useIsWindowScrolled } from '@conar/ui/hookas/use-is-window-scrolled'
import { cn } from '@conar/ui/lib/utils'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useRef } from 'react'
import { Footer } from '~/components/footer'
import { Navbar } from '~/components/navbar'

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
})

function RouteComponent() {
  const navbarRef = useRef<HTMLDivElement>(null)
  const { height } = useElementSize(navbarRef)
  const isScrolled = useIsWindowScrolled({ threshold: 50 })

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-950">
      <Navbar
        ref={navbarRef}
        className={cn(
          'container mx-auto sticky top-0 py-10 z-50 transition-all duration-300 bg-gray-100 dark:bg-neutral-950',
          isScrolled && 'py-4',
        )}
      />
      <div className="container mx-auto relative rounded-3xl bg-background">
        <div
          className="sticky left-0 right-0 z-40 w-full h-10 overflow-hidden pointer-events-none"
          style={{
            top: `${height}px`,
          }}
        >
          <div className="w-full h-20 rounded-3xl ring-50 ring-gray-100 dark:ring-neutral-950" />
        </div>
        <div
          className="sticky inset-x-0 z-30 top-0 w-full"
          style={{
            top: `${height}px`,
          }}
        >
          <BlurGradient className="absolute inset-x-0 h-[200px]" />
        </div>
        <div
          className="sticky inset-x-0 z-30 bottom-0 w-full h-[1px]"
        >
          <BlurGradient className="absolute bottom-0 inset-x-0 rotate-180 h-[200px]" />
        </div>
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
