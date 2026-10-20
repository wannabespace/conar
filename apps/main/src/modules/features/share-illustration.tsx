import { Link01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cardClass } from '@tamery/ui/components/card.utils'
import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'

import { ResultsTable } from './results-table'
import { pop, rise } from './variants'

const LINK = 'share.tamery.app/7kq2'

const ROWS = [
  ['Priya Raman', '$608.94'],
  ['Tomás Ferreira', '$608.65'],
]

const COPIED_AT = 0.2
const OPEN_AT = 0.7

export const ShareIllustration = () => (
  <div className="absolute inset-x-6 bottom-6 flex flex-col gap-3">
    <motion.div
      variants={pop(COPIED_AT, 6)}
      className="bg-input ring-foreground/4 flex h-8 items-center gap-1.5 self-start rounded-lg px-2.5 text-xs shadow-xs ring"
    >
      <HugeiconsIcon
        icon={Link01Icon}
        strokeWidth={2}
        className="text-muted-foreground size-3.5 shrink-0"
      />
      {LINK}
      <HugeiconsIcon
        icon={Tick02Icon}
        strokeWidth={2}
        className="text-primary size-3.5 shrink-0"
      />
    </motion.div>
    <motion.div
      variants={rise(OPEN_AT)}
      className={cn(cardClass, 'flex flex-col gap-2 p-2.5 shadow-md')}
    >
      <span className="px-1 text-sm font-semibold tracking-tight">
        Top orders
      </span>
      <ResultsTable at={OPEN_AT + 0.1} rows={ROWS} />
    </motion.div>
  </div>
)
