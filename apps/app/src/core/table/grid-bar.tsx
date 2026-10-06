import { Separator } from '@tamery/ui/components/separator'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useSubscription } from 'seitu/react'

import { isNumericColumn } from './cell/utils'
import type { DataGridCell, GridCursor } from './cursor'

export interface GridBarItem {
  content: ReactNode
  id: string
}

const ease = [0.32, 0.72, 0, 1] as const

const statFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
})

const fold = {
  animate: { opacity: 1, transition: { duration: 0.15, ease }, width: 'auto' },
  exit: { opacity: 0, transition: { duration: 0.1, ease }, width: 0 },
  initial: { opacity: 0, width: 0 },
}

const summarize = (
  cells: DataGridCell[],
  getValue: (cell: DataGridCell) => unknown
): [string, number][] => {
  const filled = cells.filter((cell) => {
    const value = getValue(cell)
    return value !== null && value !== undefined && value !== ''
  })
  const numbers = filled
    .filter((cell) => isNumericColumn(cell.column))
    .map((cell) => Number(getValue(cell)))
    .filter((value) => Number.isFinite(value))
  const count: [string, number] = ['Count', filled.length]
  if (numbers.length === 0) {
    return [count]
  }
  let [sum, min, max] = [0, Infinity, -Infinity]
  for (const value of numbers) {
    sum += value
    min = Math.min(min, value)
    max = Math.max(max, value)
  }
  return [
    ['Sum', sum],
    ['Average', sum / numbers.length],
    ['Min', min],
    ['Max', max],
    count,
  ]
}

const Summary = ({ stats }: { stats: [string, number][] }) => (
  <div className="flex h-7 items-center gap-3 px-1.5 text-xs">
    {stats.map(([label, value]) => (
      <span key={label} className="flex items-center gap-1">
        <span className="text-muted-foreground">{label}</span>
        <span data-mask className="tabular-nums">
          {statFormat.format(value)}
        </span>
      </span>
    ))}
  </div>
)

export const GridBar = ({
  cursor,
  items,
}: {
  cursor: GridCursor
  items?: GridBarItem[]
}) => {
  const range = useSubscription(cursor.store, {
    selector: ({ anchor, cursor: at }) => (anchor ? { anchor, at } : null),
  })
  const cells = range ? cursor.selection().flat() : []
  const shown =
    cells.length < 2
      ? (items ?? [])
      : [
          {
            content: <Summary stats={summarize(cells, cursor.getValue)} />,
            id: 'summary',
          },
          ...(items ?? []),
        ]

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center">
      <AnimatePresence>
        {shown.length > 0 && (
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, transition: { duration: 0.15, ease }, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1, ease }, y: 8 }}
            className="bg-popover/70 ring-foreground/4 pointer-events-auto flex items-center rounded-xl p-1 whitespace-nowrap shadow-md ring backdrop-blur"
          >
            <AnimatePresence initial={false}>
              {shown.flatMap((item, index) => [
                index > 0 && (
                  <motion.div
                    key={`separator-${item.id}`}
                    {...fold}
                    className="flex h-4 shrink-0 justify-center overflow-clip"
                  >
                    <Separator orientation="vertical" className="mx-3" />
                  </motion.div>
                ),
                <motion.div
                  key={item.id}
                  {...fold}
                  className="flex shrink-0 items-center gap-1 overflow-clip [overflow-clip-margin:4px]"
                >
                  {item.content}
                </motion.div>,
              ])}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
