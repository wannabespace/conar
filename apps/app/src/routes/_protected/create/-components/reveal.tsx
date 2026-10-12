import { motion } from 'motion/react'
import type { ReactNode } from 'react'

const EASE = [0.32, 0.72, 0, 1] as const

export const REVEAL_STAGGER = {
  animate: { transition: { staggerChildren: 0.04 } },
}

/** One block of the form rising into place; a child of a `REVEAL_STAGGER` parent. */
export const Reveal = ({ children }: { children: ReactNode }) => (
  <motion.div
    className="flex flex-col gap-5"
    variants={{
      animate: { opacity: 1, transition: { duration: 0.25, ease: EASE }, y: 0 },
      initial: { opacity: 0, y: 8 },
    }}
  >
    {children}
  </motion.div>
)
