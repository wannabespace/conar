import {
  CornerDownLeftIcon,
  CommandIcon,
  LayoutTable02Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Kbd } from '@tamery/ui/components/kbd'
import { motion } from 'motion/react'

import { ProductCrop } from './product-crop'
import { Typed } from './typed'
import { appear, collapse, rise } from './variants'

const QUERY = 'ord'
const PICKED_TABLE = 'orders'
const TABLES = [
  'customers',
  'invoices',
  PICKED_TABLE,
  'order_items',
  'products',
]

const TYPE_AT = 0.3
const TYPE_STEP = 0.14
const MATCH_AT = TYPE_AT + QUERY.length * TYPE_STEP + 0.05
const PICKED_AT = MATCH_AT + 0.25

export const KeyboardIllustration = () => (
  <ProductCrop className="min-w-0">
    <motion.div
      variants={rise(0.05)}
      className="flex h-11 items-center gap-2 border-b px-3 text-sm whitespace-pre"
    >
      <HugeiconsIcon
        icon={Search01Icon}
        strokeWidth={2}
        className="text-muted-foreground size-4"
      />
      <span className="flex items-center">
        <Typed at={TYPE_AT} step={TYPE_STEP} text={QUERY} />
        <span className="bg-primary ml-px h-4 w-px" />
      </span>
      <Kbd className="ml-auto">
        <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />P
      </Kbd>
    </motion.div>
    <div className="flex flex-col p-1.5 text-xs">
      <span className="text-muted-foreground text-2xs px-2 py-1 font-medium">
        Tables
      </span>
      {TABLES.map((table) => (
        <motion.div
          key={table}
          variants={table.includes(QUERY) ? undefined : collapse(MATCH_AT)}
          className="overflow-hidden"
        >
          <div className="relative isolate flex h-8 items-center gap-2 rounded-md px-2">
            {table === PICKED_TABLE && (
              <motion.span
                aria-hidden
                variants={appear(PICKED_AT)}
                className="bg-accent absolute inset-0 -z-10 rounded-md"
              />
            )}
            <HugeiconsIcon
              icon={LayoutTable02Icon}
              strokeWidth={2}
              className="text-muted-foreground size-3.5"
            />
            {table}
            {table === PICKED_TABLE && (
              <motion.span variants={appear(PICKED_AT)} className="ml-auto">
                <Kbd>
                  <HugeiconsIcon icon={CornerDownLeftIcon} strokeWidth={2} />
                </Kbd>
              </motion.span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  </ProductCrop>
)
