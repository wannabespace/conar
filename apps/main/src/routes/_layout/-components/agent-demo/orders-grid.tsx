import { Badge } from '@tamery/ui/components/badge'
import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'

import { ORDER_ID } from './script'

const ORDERS = [
  ['58340', 'Priya Raman', '$608.94', 'paid'],
  ['58307', 'Tomás Ferreira', '$608.65', 'paid'],
  [ORDER_ID, 'Daniel Okafor', '$605.91', 'pending'],
  ['58305', 'Mateo Álvarez', '$600.36', 'paid'],
  ['58311', 'Kenji Mori', '$592.24', 'paid'],
  ['58336', 'Hana Kobayashi', '$584.86', 'paid'],
  ['58303', 'Oskar Lindqvist', '$581.35', 'pending'],
]

const STATUS_DOTS: Record<string, string> = {
  paid: 'bg-success',
  pending: 'bg-warning',
  refunded: 'bg-destructive',
}

const cellClassName = 'flex h-full shrink-0 items-center border-r px-2.5'

export const OrdersGrid = ({ refunded }: { refunded: boolean }) => (
  <div className="bg-background ring-foreground/4 overflow-hidden rounded-lg text-xs ring">
    <div className="text-muted-foreground flex h-8 border-b font-medium">
      <div className={cn(cellClassName, 'w-16')}>id</div>
      <div className={cn(cellClassName, 'min-w-0 flex-1')}>customer</div>
      <div className={cn(cellClassName, 'hidden w-20 sm:flex')}>total</div>
      <div className={cn(cellClassName, 'w-28 border-r-0')}>status</div>
    </div>
    {ORDERS.map(([id, customer, total, initialStatus = '']) => {
      const isTarget = id === ORDER_ID
      const status = isTarget && refunded ? 'refunded' : initialStatus
      return (
        <div key={id} className="flex h-8 border-b last:border-b-0">
          <div className={cn(cellClassName, 'w-16 tabular-nums')}>{id}</div>
          <div className={cn(cellClassName, 'min-w-0 flex-1 truncate')}>
            {customer}
          </div>
          <div
            className={cn(cellClassName, 'hidden w-20 tabular-nums sm:flex')}
          >
            {total}
          </div>
          <div className={cn(cellClassName, 'relative w-28 border-r-0')}>
            {isTarget && refunded && (
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="bg-primary/20 absolute inset-0"
              />
            )}
            <Badge variant="secondary" className="relative">
              <span
                className={cn('size-1.5 rounded-full', STATUS_DOTS[status])}
              />
              {status}
            </Badge>
          </div>
        </div>
      )
    })}
  </div>
)
