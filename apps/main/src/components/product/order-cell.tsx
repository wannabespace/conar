import { OrderStatusBadge } from './order-status-badge'
import type { Order } from './orders'

export const OrderCell = ({ id, order }: { id: keyof Order; order: Order }) =>
  id === 'status' ? <OrderStatusBadge status={order.status} /> : order[id]
