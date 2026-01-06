import { TextHoverEffect } from '@conar/ui/components/aceternity/text-hover-effect'
import { BlurGradient } from '@conar/ui/components/custom/blur-gradient'
import { cn } from '@conar/ui/lib/utils'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { motion, useScroll, useTransform } from 'motion/react'
import { Footer } from '~/components/footer'
import { Navbar } from '~/components/navbar'
import { NAVBAR_HEIGHT_BASE, NAVBAR_HEIGHT_SCROLLED } from '~/constants'

export const Route = createFileRoute('/_layout')({
  component: MainLayout,
})

function MainLayout() {
  const { scrollY } = useScroll()
  const navbarHeight = useTransform(scrollY, [0, NAVBAR_HEIGHT_BASE], [NAVBAR_HEIGHT_BASE, NAVBAR_HEIGHT_SCROLLED])
  const navbarHeightPx = useTransform(() => `${Math.ceil(navbarHeight.get())}px`)
  const blurTranslateY = useTransform(() => `${Math.min((NAVBAR_HEIGHT_BASE - scrollY.get()) * -1, 0)}px`)

  return (
    <motion.div className="container mx-auto px-4" style={{ '--navbar-height': navbarHeightPx }}>
      <div className={cn(`
        sticky top-0 z-50 h-(--navbar-height) w-full bg-gray-100
        dark:bg-neutral-950
      `)}
      >
        <div className="relative flex h-full w-full items-center">
          <Navbar className="w-full" />
          <div className={`
            pointer-events-none absolute top-full right-0 left-0 h-10 w-full
            overflow-hidden
          `}
          >
            <div className={`
              h-20 w-full rounded-3xl ring-50 ring-gray-100
              dark:ring-neutral-950
            `}
            />
          </div>
        </div>
      </div>
      <div className="rounded-3xl bg-background">
        <motion.div
          className={cn(
            'sticky inset-x-0 top-(--navbar-height) z-30 w-full',
          )}
          style={{
            translateY: blurTranslateY,
          }}
        >
          <BlurGradient
            className={`
              absolute inset-x-0 h-48 transition-all delay-300 duration-400
            `}
          />
        </motion.div>
        <Outlet />
        <div className="sticky inset-x-0 bottom-0 z-30 w-full">
          <div className={`
            pointer-events-none relative z-20 h-10 w-full overflow-hidden
          `}
          >
            <div className={`
              absolute inset-x-0 bottom-0 h-20 rounded-3xl ring-50 ring-gray-100
              dark:ring-neutral-950
            `}
            />
          </div>
          <div className={`
            relative z-20 h-4 bg-gray-100
            dark:bg-neutral-950
          `}
          />
        </div>
      </div>
      <Footer />
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <TextHoverEffect className="tracking-tighter" text="Conar" />
      </motion.div>
    </motion.div>
  )
}
