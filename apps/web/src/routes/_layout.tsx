import { BlurGradient } from '@conar/ui/components/custom/blur-gradient'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import { Footer } from '~/components/footer'
import { Navbar } from '~/components/navbar'

export const Route = createFileRoute('/_layout')({
  component: MainLayout,
})

const NAVBAR_HEIGHT_BASE = 200
const NAVBAR_HEIGHT_SCROLLED = 60

function MainLayout() {
  const { scrollYProgress } = useScroll()
  const navbarHeight = useTransform(scrollYProgress, [0, 0.5], [NAVBAR_HEIGHT_BASE, NAVBAR_HEIGHT_SCROLLED])
  const navbarHeightPx = useTransform(() => `${navbarHeight.get()}px`)

  return (
    <motion.div
      className="min-h-screen"
      style={{
        '--navbar-height': navbarHeightPx,
      } as React.CSSProperties}
    >
      <div className="fixed top-0 w-full h-(--navbar-height) z-50 bg-gray-100 dark:bg-neutral-950">
        <div className="relative h-full flex items-center w-full container mx-auto">
          <Navbar className="w-full" />
          <div className="absolute left-0 right-0 top-full w-full h-10 overflow-hidden pointer-events-none">
            <div className="w-full h-20 rounded-3xl ring-50 ring-gray-100 dark:ring-neutral-950" />
          </div>
        </div>
      </div>
      <div className="container mx-auto pt-[200px] bg-background rounded-3xl">
        <div className="sticky inset-x-0 z-30 top-(--navbar-height) w-full">
          <BlurGradient
            className="absolute inset-x-0 transition-all delay-300 duration-400 h-48"
          />
        </div>
        <Outlet />
        <div className="sticky inset-x-0 z-30 bottom-0 w-full">
          <BlurGradient className="absolute bottom-0 inset-x-0 rotate-180 h-48" />
        </div>
      </div>
      <Footer />
    </motion.div>
  )
}
