import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'

import { ProductCrop } from './product-crop'
import { pop } from './variants'

const LINES = [
  ['SELECT', ' id, customer, total'],
  ['FROM', ' orders'],
  ['WHERE', ' status = '],
]

const SUGGESTIONS = ["'paid'", "'pending'", "'refunded'"]

export const CompletionIllustration = () => (
  <ProductCrop>
    <div className="py-3 font-mono text-sm/7">
      {LINES.map(([keyword, rest], index) => (
        <div key={keyword} className="flex">
          <span className="text-muted-foreground/60 w-10 shrink-0 pr-3 text-right">
            {index + 1}
          </span>
          <span className="text-muted-foreground">{keyword}</span>
          <span className="whitespace-pre">{rest}</span>
          {index === LINES.length - 1 && (
            <span className="relative">
              <span className="bg-primary inline-block h-4 w-px translate-y-0.5" />
              <motion.div
                variants={pop(0.35, -4)}
                className="bg-popover ring-foreground/4 absolute top-8 left-0 w-44 origin-top-left overflow-hidden rounded-lg p-1 font-sans text-xs shadow-lg ring"
              >
                {SUGGESTIONS.map((suggestion) => (
                  <div
                    key={suggestion}
                    className={cn(
                      'flex h-7 items-center justify-between rounded-md px-2',
                      suggestion === SUGGESTIONS[0] && 'bg-primary/15'
                    )}
                  >
                    <span className="font-mono">{suggestion}</span>
                    <span className="text-muted-foreground">enum</span>
                  </div>
                ))}
              </motion.div>
            </span>
          )}
        </div>
      ))}
    </div>
  </ProductCrop>
)
