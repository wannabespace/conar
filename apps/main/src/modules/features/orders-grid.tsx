import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'

import {
  ORDER_COLUMNS,
  orderCellClass,
} from '~/components/product/order-columns'
import { OrderStatusBadge } from '~/components/product/order-status-badge'
import type { Order } from '~/components/product/orders'
import { OrdersHeader } from '~/components/product/orders-header'

import { collapse, flash, rise } from './variants'

const COLUMNS = ORDER_COLUMNS.filter(
  ({ id }) => id !== 'user_id' && id !== 'created_at'
)

export const OrdersGrid = ({
  at,
  filtered,
  flashed,
  orders,
}: {
  at: number
  filtered?: { at: number; matches: (order: Order) => boolean }
  flashed?: { at: number; id: string }
  orders: Order[]
}) => (
  <div>
    <OrdersHeader columns={COLUMNS} />
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
                orderCellClass,
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
