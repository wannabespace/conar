import { CommandIcon, Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { motion } from 'motion/react'

import { HOUSE_EASE } from '~/utils/motion'

const ROWS = ['Open table', 'New query', 'Toggle AI chat']

const PALETTE_AT = 0.55

const press = (delay: number) => ({
  hidden: { y: 0 },
  shown: { transition: { delay, duration: 0.24 }, y: [0, 3, 0] },
})

const keyClassName =
  'bg-popover ring-foreground/4 flex size-16 items-center justify-center rounded-2xl text-2xl font-medium shadow-md ring'

export const KeyboardIllustration = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-end gap-4 pb-6">
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.96, y: 6 },
        shown: {
          opacity: 1,
          scale: 1,
          transition: { delay: PALETTE_AT, duration: 0.2, ease: HOUSE_EASE },
          y: 0,
        },
      }}
      className="bg-popover ring-foreground/4 w-52 origin-bottom overflow-hidden rounded-xl text-xs shadow-lg ring"
    >
      <div className="text-muted-foreground flex h-8 items-center gap-2 border-b px-3">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="size-3.5"
        />
        Type a command…
      </div>
      <div className="p-1">
        {ROWS.map((row, index) => (
          <div
            key={row}
            className={
              index === 0
                ? 'bg-primary text-primary-foreground flex h-6 items-center rounded-md px-2'
                : 'flex h-6 items-center px-2'
            }
          >
            {row}
          </div>
        ))}
      </div>
    </motion.div>
    <div className="flex gap-3">
      <motion.div variants={press(0.1)} className={keyClassName}>
        <HugeiconsIcon icon={CommandIcon} strokeWidth={2} className="size-6" />
      </motion.div>
      <motion.div variants={press(0.3)} className={keyClassName}>
        P
      </motion.div>
    </div>
  </div>
)
