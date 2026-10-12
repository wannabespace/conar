import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'

import { rise } from './variants'

export const ResultsTable = ({
  at,
  rows,
}: {
  at: number
  rows: string[][]
}) => (
  <motion.div
    variants={rise(at)}
    className="bg-popover ring-foreground/4 overflow-hidden rounded-xl text-xs shadow-sm ring"
  >
    {rows.map((cells, index) => (
      <motion.div
        key={cells[0]}
        variants={rise(at + 0.1 + index * 0.06)}
        className={cn(
          'flex h-8 items-center gap-4 px-3',
          index > 0 && 'border-t'
        )}
      >
        {cells.map((cell, cellIndex) => (
          <span
            key={cell}
            className={
              cellIndex === 0
                ? 'flex-1 truncate'
                : 'w-20 text-right tabular-nums'
            }
          >
            {cell}
          </span>
        ))}
      </motion.div>
    ))}
  </motion.div>
)
