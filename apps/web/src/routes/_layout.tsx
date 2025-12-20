import { TextHoverEffect } from '@conar/ui/components/aceternity/text-hover-effect'
import { BlurGradient } from '@conar/ui/components/custom/blur-gradient'
import { cn } from '@conar/ui/lib/utils'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import { Footer } from '~/components/footer'
import { Navbar } from '~/components/navbar'
import { NAVBAR_HEIGHT_BASE, NAVBAR_HEIGHT_SCROLLED } from './layout-constants'

export { NAVBAR_HEIGHT_BASE, NAVBAR_HEIGHT_SCROLLED } from './layout-constants'

export const Route = createFileRoute('/_layout')({
  component: MainLayout,
})

function MainLayout() {
  const { scrollY } = useScroll()
  const navbarHeight = useTransform(scrollY, [0, NAVBAR_HEIGHT_BASE], [NAVBAR_HEIGHT_BASE, NAVBAR_HEIGHT_SCROLLED])
  const navbarHeightPx = useTransform(() => `${Math.ceil(navbarHeight.get())}px`)
  const blurTranslateY = useTransform(() => `${Math.min((NAVBAR_HEIGHT_BASE - scrollY.get()) * -1, 0)}px`)

  return (
    <motion.div style={{ '--navbar-height': navbarHeightPx }}>
      <div className="sticky top-0 w-full h-(--navbar-height) z-50 bg-gray-100 dark:bg-neutral-950">
        <div className="relative h-full flex items-center w-full container mx-auto">
          <Navbar className="w-full" />
          <div className="absolute left-0 right-0 top-full w-full h-10 overflow-hidden pointer-events-none">
            <div className="w-full h-20 rounded-3xl ring-50 ring-gray-100 dark:ring-neutral-950" />
          </div>
        </div>
      </div>
      <div className="container mx-auto bg-background rounded-3xl">
        <motion.div
          className={cn(
            'sticky inset-x-0 z-30 top-(--navbar-height) w-full',
          )}
          style={{
            translateY: blurTranslateY,
          }}
        >
          <BlurGradient
            className="absolute inset-x-0 transition-all delay-300 duration-400 h-48"
          />
        </motion.div>
        <Outlet />
        <div className="sticky inset-x-0 z-30 bottom-0 w-full">
          <div className="z-20 relative w-full h-10 overflow-hidden pointer-events-none">
            <div className="absolute bottom-0 inset-x-0 h-20 rounded-3xl ring-50 ring-gray-100 dark:ring-neutral-950" />
          </div>
          <div className="relative z-20 bg-gray-100 dark:bg-neutral-950 h-4" />
        </div>
      </div>
      <Footer />
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="container mx-auto"
      >
        <TextHoverEffect className="tracking-tighter" text="Conar" />
      </motion.div>
    </motion.div>
  )
}
