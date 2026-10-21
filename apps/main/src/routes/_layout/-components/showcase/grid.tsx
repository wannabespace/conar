import {
  ArrowUpRight01Icon,
  MoreHorizontalIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { Separator } from '@tamery/ui/components/separator'
import { cn } from '@tamery/ui/lib/utils'

import { OrderCell } from '~/components/product/order-cell'
import {
  ORDER_COLUMNS,
  orderCellClass,
} from '~/components/product/order-columns'
import { ORDERS } from '~/components/product/orders'
import { OrdersHeader } from '~/components/product/orders-header'

const SELECTED_ROWS = new Set(['58309', '58305'])
const EDITED_ROW = '58338'

export const Grid = () => (
  <div className="relative min-h-0 flex-1 overflow-hidden border-t">
    <OrdersHeader
      columns={ORDER_COLUMNS}
      action={
        <Button variant="ghost-muted" size="icon-xs">
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />
        </Button>
      }
    >
      <div className="flex w-10 shrink-0 items-center justify-center border-r">
        <Checkbox />
      </div>
    </OrdersHeader>
    {ORDERS.map((order) => (
      <div key={order.id} className="flex h-8 border-b">
        <div className="flex w-10 shrink-0 items-center justify-center border-r">
          <Checkbox checked={SELECTED_ROWS.has(order.id)} />
        </div>
        {ORDER_COLUMNS.map(({ id, width }) => (
          <div
            key={id}
            className={cn(
              orderCellClass,
              width,
              id === 'status' && order.id === EDITED_ROW && 'bg-warning/15'
            )}
          >
            <OrderCell id={id} order={order} />
            {id === 'user_id' && (
              <Button variant="ghost-faint" size="icon-2xs" className="ml-auto">
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  strokeWidth={2}
                  className="text-muted-foreground size-3"
                />
              </Button>
            )}
          </div>
        ))}
      </div>
    ))}
    <div className="absolute inset-x-0 bottom-4 flex justify-center">
      <div className="bg-popover/70 ring-foreground/4 flex items-center gap-1 rounded-xl p-1 shadow-lg ring backdrop-blur">
        <Button variant="destructive" size="sm">
          Delete (2)
        </Button>
        <Separator orientation="vertical" className="mx-0.5 h-4!" />
        <Button variant="ghost-muted" size="sm">
          Review
        </Button>
        <Button size="sm">Save (1)</Button>
      </div>
    </div>
  </div>
)
