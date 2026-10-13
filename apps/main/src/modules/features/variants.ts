import type { Variants } from 'motion/react'

export const rise = (delay: number): Variants => ({
  hidden: { opacity: 0, y: 8 },
  shown: {
    opacity: 1,
    transition: { delay, duration: 0.4, ease: [0.32, 0.72, 0, 1] },
    y: 0,
  },
})

export const pop = (delay: number, fromY: number): Variants => ({
  hidden: { opacity: 0, scale: 0.96, y: fromY },
  shown: {
    opacity: 1,
    scale: 1,
    transition: { delay, duration: 0.2, ease: [0.32, 0.72, 0, 1] },
    y: 0,
  },
})
