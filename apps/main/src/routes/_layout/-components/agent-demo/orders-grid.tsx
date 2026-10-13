import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tamery/ui/components/table'
import { motion } from 'motion/react'

import { OrderStatusBadge } from '../order-status-badge'
import { ORDERS } from '../orders'
import { ORDER_ID } from './script'

const ROWS = ORDERS.filter((order) => order.status !== 'refunded').slice(0, 7)

export const OrdersGrid = ({ refunded }: { refunded: boolean }) => (
  <div className="bg-background ring-foreground/4 overflow-hidden rounded-lg ring">
    <Table size="sm">
      <TableHeader>
        <TableRow>
          <TableHead>id</TableHead>
          <TableHead className="w-full">customer</TableHead>
          <TableHead className="hidden sm:table-cell">total</TableHead>
          <TableHead>status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map(({ customer, id, status, total }) => {
          const isTarget = id === ORDER_ID
          return (
            <TableRow key={id}>
              <TableCell>{id}</TableCell>
              <TableCell>{customer}</TableCell>
              <TableCell variant="numeric" className="hidden sm:table-cell">
                {total}
              </TableCell>
              <TableCell className="relative">
                {isTarget && refunded && (
                  <motion.span
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="bg-primary/20 absolute inset-0"
                  />
                )}
                <OrderStatusBadge
                  status={isTarget && refunded ? 'refunded' : status}
                  className="relative"
                />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  </div>
)
