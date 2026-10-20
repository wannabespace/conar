import type { Variants } from 'motion/react'

export const EASE = [0.32, 0.72, 0, 1] as const

export const rise = (delay: number): Variants => ({
  hidden: { opacity: 0, y: 8 },
  shown: {
    opacity: 1,
    transition: { delay, duration: 0.4, ease: EASE },
    y: 0,
  },
})

export const pop = (delay: number, fromY: number): Variants => ({
  hidden: { opacity: 0, scale: 0.96, y: fromY },
  shown: {
    opacity: 1,
    scale: 1,
    transition: { delay, duration: 0.2, ease: EASE },
    y: 0,
  },
})

export const appear = (delay: number): Variants => ({
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { delay, duration: 0.15 } },
})

export const vanish = (delay: number): Variants => ({
  hidden: { opacity: 1 },
  shown: { opacity: 0, transition: { delay, duration: 0.15 } },
})

export const collapse = (delay: number): Variants => ({
  hidden: { height: 'auto', opacity: 1 },
  shown: {
    height: 0,
    opacity: 0,
    transition: { delay, duration: 0.35, ease: EASE },
  },
})

export const revealDown = (delay: number, duration: number): Variants => ({
  hidden: { clipPath: 'inset(0 0 100% 0)' },
  shown: {
    clipPath: 'inset(0 0 0% 0)',
    transition: { delay, duration, ease: 'linear' },
  },
})

export const revealRight = (delay: number, duration: number): Variants => ({
  hidden: { clipPath: 'inset(0 100% 0 0)' },
  shown: {
    clipPath: 'inset(0 0% 0 0)',
    transition: { delay, duration, ease: 'linear' },
  },
})

export const flash = (delay: number): Variants => ({
  hidden: { opacity: 0 },
  shown: {
    opacity: [0, 1, 0],
    transition: { delay, duration: 1.4, times: [0, 0.12, 1] },
  },
})
