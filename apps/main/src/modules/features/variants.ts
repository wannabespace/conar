import { HOUSE_EASE } from '~/utils/motion'

export const rise = (delay: number) => ({
  hidden: { opacity: 0, y: 8 },
  shown: {
    opacity: 1,
    transition: { delay, duration: 0.4, ease: HOUSE_EASE },
    y: 0,
  },
})

export const pop = (delay: number, fromY: number) => ({
  hidden: { opacity: 0, scale: 0.96, y: fromY },
  shown: {
    opacity: 1,
    scale: 1,
    transition: { delay, duration: 0.2, ease: HOUSE_EASE },
    y: 0,
  },
})
