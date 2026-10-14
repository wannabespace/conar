import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/** One block of the form rising into place; a child of a parent staggering its `initial` → `animate` variants. */
export const Reveal = ({ children }: { children: ReactNode }) => (
  <motion.div
    className="flex flex-col gap-5"
    variants={{
      animate: {
        opacity: 1,
        transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
        y: 0,
      },
      initial: { opacity: 0, y: 8 },
    }}
  >
    {children}
  </motion.div>
)
