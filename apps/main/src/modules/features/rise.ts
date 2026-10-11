import { HOUSE_EASE } from '~/utils/motion'

export const rise = (delay: number) => ({
  hidden: { opacity: 0, y: 8 },
  shown: {
    opacity: 1,
    transition: { delay, duration: 0.4, ease: HOUSE_EASE },
    y: 0,
  },
})
