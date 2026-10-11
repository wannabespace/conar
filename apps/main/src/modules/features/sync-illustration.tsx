import { Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'

import { HOUSE_EASE } from '~/utils/motion'

const ARC = 'M 140 58 Q 184 -12 228 44'

const TRAVEL_S = 0.8
const ARRIVE_AT = 0.2 + TRAVEL_S

const WindowBars = () => (
  <>
    <div className="flex gap-1 p-2">
      <span className="bg-secondary size-1.5 rounded-full" />
      <span className="bg-secondary size-1.5 rounded-full" />
      <span className="bg-secondary size-1.5 rounded-full" />
    </div>
    <div className="flex flex-col gap-1.5 px-2">
      <span className="bg-secondary h-1.5 w-3/4 rounded-full" />
      <span className="bg-secondary h-1.5 w-1/2 rounded-full" />
      <span className="bg-secondary h-1.5 w-2/3 rounded-full" />
    </div>
  </>
)

export const SyncIllustration = () => (
  <div className="absolute inset-x-0 bottom-8 mx-auto h-40 w-72">
    <svg
      viewBox="0 0 288 160"
      className="absolute inset-0 size-full overflow-visible"
    >
      <path
        d={ARC}
        fill="none"
        strokeWidth={2}
        strokeDasharray="4 6"
        className="stroke-secondary"
      />
      <motion.path
        d={ARC}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        className="stroke-primary"
        variants={{
          hidden: { opacity: 1, pathLength: 0 },
          shown: {
            opacity: 0,
            pathLength: 1,
            transition: {
              opacity: { delay: ARRIVE_AT, duration: 0.4 },
              pathLength: { delay: 0.2, duration: TRAVEL_S, ease: HOUSE_EASE },
            },
          },
        }}
      />
    </svg>
    <div className="bg-popover ring-foreground/4 absolute bottom-0 left-0 h-24 w-36 overflow-hidden rounded-xl shadow-md ring">
      <WindowBars />
    </div>
    <div className="bg-popover ring-foreground/4 absolute right-0 bottom-0 h-28 w-16 overflow-hidden rounded-2xl shadow-md ring">
      <WindowBars />
      <motion.span
        variants={{
          hidden: { opacity: 0, scale: 0.5 },
          shown: {
            opacity: 1,
            scale: 1,
            transition: {
              bounce: 0.4,
              delay: ARRIVE_AT - 0.1,
              duration: 0.5,
              type: 'spring',
            },
          },
        }}
        className="bg-primary text-primary-foreground absolute right-2 bottom-2 flex size-5 items-center justify-center rounded-full"
      >
        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3" />
      </motion.span>
    </div>
  </div>
)
