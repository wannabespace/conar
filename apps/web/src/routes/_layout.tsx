import { BlurGradient } from '@conar/ui/components/custom/blur-gradient'
import { useDebouncedMemo } from '@conar/ui/hookas/use-debounced-memo'
import { useIsMounted } from '@conar/ui/hookas/use-is-mounted'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Footer } from '~/components/footer'
import { Navbar } from '~/components/navbar'

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
})

function RouteComponent() {
  const isMounted = useIsMounted()
  const showGradients = useDebouncedMemo(() => isMounted, [isMounted], 1000)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-950/60">
      {showGradients && (
        <>
          <BlurGradient className="fixed z-40 inset-x-0 top-0 h-[200px]" />
          <BlurGradient className="fixed z-40 inset-x-0 bottom-0 rotate-180 h-[200px]" />
        </>
      )}
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  )
}
