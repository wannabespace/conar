import type { MotionProps } from 'motion/react'

export const MOTION_BLOCK_PROPS = {
  initial: { opacity: 0, scale: 0.75 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.75 },
  transition: { duration: 0.15 },
} satisfies MotionProps
