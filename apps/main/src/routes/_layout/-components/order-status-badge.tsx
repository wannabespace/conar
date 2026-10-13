import { Badge } from '@tamery/ui/components/badge'
import { cn } from '@tamery/ui/lib/utils'

import type { OrderStatus } from './orders'

const STATUS_DOTS: Record<OrderStatus, string> = {
  paid: 'bg-success',
  pending: 'bg-warning',
  refunded: 'bg-destructive',
}

export const OrderStatusBadge = ({
  className,
  status,
}: {
  className?: string
  status: OrderStatus
}) => (
  <Badge variant="secondary" className={className}>
    <span className={cn('size-1.5 rounded-full', STATUS_DOTS[status])} />
    {status}
  </Badge>
)
