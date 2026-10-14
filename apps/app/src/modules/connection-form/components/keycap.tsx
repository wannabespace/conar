import { motion } from 'motion/react'
import type { ReactNode } from 'react'

export const Keycap = ({
  children,
  pressed,
}: {
  children: ReactNode
  pressed: boolean
}) => (
  <motion.span
    data-pressed={pressed || undefined}
    className="bg-input ring-foreground/4 flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-base font-medium shadow-md ring transition-shadow duration-100 data-pressed:shadow-xs [&_svg]:size-4"
    animate={pressed ? { scale: 0.95, y: 2 } : { scale: 1, y: 0 }}
    transition={{ duration: 0.1, ease: [0.32, 0.72, 0, 1] }}
  >
    {children}
  </motion.span>
)
