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

import { rise } from './variants'

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

export const OrdersGrid = ({ at, orders }: { at: number; orders: Order[] }) => (
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
        variants={rise(at + index * 0.05)}
        className="flex h-8 border-b"
      >
        {COLUMNS.map(({ id, numeric, width }) => (
          <div
            key={id}
            className={cn(cellClassName, width, numeric && 'tabular-nums')}
          >
            {id === 'status' ? (
              <OrderStatusBadge status={order.status} />
            ) : (
              order[id]
            )}
          </div>
        ))}
      </motion.div>
    ))}
  </div>
)
