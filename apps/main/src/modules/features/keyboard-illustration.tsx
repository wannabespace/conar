import {
  CommandIcon,
  LayoutTable02Icon,
  PlayIcon,
  Search01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Kbd, KbdGroup } from '@tamery/ui/components/kbd'
import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'

import { ProductCrop } from './product-crop'
import { rise } from './variants'

const GROUPS: {
  items: { icon: IconSvgElement; key?: string; label: string }[]
  title: string
}[] = [
  {
    items: [
      { icon: LayoutTable02Icon, label: 'orders' },
      { icon: LayoutTable02Icon, label: 'order_items' },
    ],
    title: 'Tables',
  },
  {
    items: [
      { icon: PlayIcon, key: 'N', label: 'New query' },
      { icon: SparklesIcon, key: 'L', label: 'Toggle AI chat' },
    ],
    title: 'Actions',
  },
]

export const KeyboardIllustration = () => (
  <ProductCrop className="min-w-0">
    <div className="flex h-11 items-center gap-2 border-b px-3 text-sm">
      <HugeiconsIcon
        icon={Search01Icon}
        strokeWidth={2}
        className="text-muted-foreground size-4"
      />
      ord
      <span className="bg-primary -ml-1.5 h-4 w-px" />
      <KbdGroup className="ml-auto">
        <Kbd>
          <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />P
        </Kbd>
      </KbdGroup>
    </div>
    <div className="flex flex-col gap-2 p-1.5 text-xs">
      {GROUPS.map(({ items, title }, group) => (
        <div key={title} className="flex flex-col">
          <span className="text-muted-foreground text-2xs px-2 py-1 font-medium">
            {title}
          </span>
          {items.map(({ icon, key, label }, index) => (
            <motion.div
              key={label}
              variants={rise(0.1 + (group * 2 + index) * 0.05)}
              className="relative isolate flex h-8 items-center gap-2 rounded-md px-2"
            >
              {label === 'orders' && (
                <motion.span
                  aria-hidden
                  variants={{
                    hidden: { opacity: 0 },
                    shown: {
                      opacity: 1,
                      transition: { delay: 0.45, duration: 0.2 },
                    },
                  }}
                  className="bg-accent absolute inset-0 -z-10 rounded-md"
                />
              )}
              <HugeiconsIcon
                icon={icon}
                strokeWidth={2}
                className={cn(
                  'size-3.5',
                  label === 'orders' ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              {label}
              {key && (
                <Kbd className="ml-auto">
                  <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />
                  {key}
                </Kbd>
              )}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  </ProductCrop>
)
