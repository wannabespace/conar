import {
  Cancel01Icon,
  CommandIcon,
  SparklesIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { FilterChip } from '@tamery/ui/components/custom/filter-chip'
import { Kbd } from '@tamery/ui/components/kbd'
import { motion } from 'motion/react'

import { ORDERS } from '~/components/product/orders'

import { OrdersGrid } from './orders-grid'
import { ProductCrop } from './product-crop'
import { pop } from './variants'

const FILTERS = [
  { column: 'status', operator: 'is', value: 'paid' },
  { column: 'total', operator: 'over', value: '580' },
]

const MATCHES = ORDERS.filter(
  ({ status, total }) => status === 'paid' && Number(total.slice(1)) > 580
)

export const FilterIllustration = () => (
  <ProductCrop>
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="bg-input ring-foreground/4 flex min-h-8 min-w-0 flex-1 items-center gap-1 rounded-xl py-0.75 pr-1.5 pl-2 shadow-xs ring">
        <HugeiconsIcon
          icon={SparklesIcon}
          strokeWidth={2}
          className="text-primary mr-1 size-4 shrink-0"
        />
        {FILTERS.map((filter, index) => (
          <motion.span
            key={filter.column}
            variants={pop(0.15 + index * 0.1, 0)}
          >
            <FilterChip {...filter}>
              <HugeiconsIcon
                icon={Cancel01Icon}
                strokeWidth={2}
                className="size-3.5"
              />
            </FilterChip>
          </motion.span>
        ))}
        <span className="text-muted-foreground min-w-0 flex-1 truncate pl-1 text-sm">
          paid orders over $580
        </span>
        <Kbd>
          <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />F
        </Kbd>
      </div>
    </div>
    <div className="border-t">
      <OrdersGrid at={0.45} orders={MATCHES} />
    </div>
  </ProductCrop>
)
