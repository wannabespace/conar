import {
  ArrowDown02Icon,
  HashtagIcon,
  Key01Icon,
  Tag01Icon,
  TextIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'

import { OrderStatusBadge } from '~/components/product/order-status-badge'
import type { ORDERS } from '~/components/product/orders'

import { collapse, flash, rise } from './variants'

type Order = (typeof ORDERS)[number]

const COLUMNS: {
  icon: IconSvgElement
  id: 'customer' | 'id' | 'status' | 'total'
  numeric?: boolean
  width: string
}[] = [
  { icon: Key01Icon, id: 'id', numeric: true, width: 'w-20' },
  { icon: TextIcon, id: 'customer', width: 'w-36' },
  { icon: HashtagIcon, id: 'total', numeric: true, width: 'w-28' },
  { icon: Tag01Icon, id: 'status', width: 'w-28' },
]

const cellClassName = 'flex h-full shrink-0 items-center border-r px-2'

export const OrdersGrid = ({
  at,
  filtered,
  flashed,
  orders,
}: {
  at: number
  /** Rows that do not match fold away at `at`, as the grid answers a new filter. */
  filtered?: { at: number; matches: (order: Order) => boolean }
  /** That row's total flashes at `at`, as a refresh changes it. */
  flashed?: { at: number; id: string }
  orders: Order[]
}) => (
  <div className="text-xs">
    <div className="flex h-8 border-b">
      {COLUMNS.map(({ icon, id, width }) => (
        <div key={id} className={cn(cellClassName, 'gap-1.5', width)}>
          <HugeiconsIcon
            icon={icon}
            strokeWidth={2}
            className={cn(
              'size-3.5 shrink-0',
              id === 'id' ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <span className="flex-1 font-medium">{id}</span>
          {id === 'total' && (
            <HugeiconsIcon
              icon={ArrowDown02Icon}
              strokeWidth={2}
              className="text-primary size-3 shrink-0"
            />
          )}
        </div>
      ))}
    </div>
    {orders.map((order, index) => (
      <motion.div
        key={order.id}
        variants={
          filtered && !filtered.matches(order)
            ? collapse(filtered.at)
            : undefined
        }
        className="overflow-hidden"
      >
        <motion.div
          variants={rise(at + index * 0.05)}
          className="flex h-8 border-b"
        >
          {COLUMNS.map(({ id, numeric, width }) => (
            <div
              key={id}
              className={cn(
                cellClassName,
                'relative isolate',
                width,
                numeric && 'tabular-nums'
              )}
            >
              {flashed?.id === order.id && id === 'total' && (
                <motion.span
                  aria-hidden
                  variants={flash(flashed.at)}
                  className="bg-primary/20 absolute inset-0 -z-10"
                />
              )}
              {id === 'status' ? (
                <OrderStatusBadge status={order.status} />
              ) : (
                order[id]
              )}
            </div>
          ))}
        </motion.div>
      </motion.div>
    ))}
  </div>
)
