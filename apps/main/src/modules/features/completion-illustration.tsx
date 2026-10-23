import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'

import { ProductCrop } from './product-crop'
import { Typed } from './typed'
import { appear, pop, rise } from './variants'

const LINES = [
  ['SELECT', ' id, customer, total'],
  ['FROM', ' orders'],
]

const TYPED_KEYWORD = 'WHERE'
const TYPED_REST = ' status = '
const SUGGESTIONS = ["'paid'", "'pending'", "'refunded'"]

const TYPE_AT = 0.3
const TYPE_STEP = 0.045
const REST_AT = TYPE_AT + TYPED_KEYWORD.length * TYPE_STEP
const OPEN_AT = REST_AT + TYPED_REST.length * TYPE_STEP + 0.1

const LineNumber = ({ line }: { line: number }) => (
  <span className="text-muted-foreground/60 w-10 shrink-0 pr-3 text-right">
    {line}
  </span>
)

export const CompletionIllustration = () => (
  <ProductCrop>
    <div className="py-3 font-mono text-sm/7">
      {LINES.map(([keyword, rest], index) => (
        <div key={keyword} className="flex">
          <LineNumber line={index + 1} />
          <span className="text-muted-foreground">{keyword}</span>
          <span className="whitespace-pre">{rest}</span>
        </div>
      ))}
      <div className="flex whitespace-pre">
        <LineNumber line={LINES.length + 1} />
        <span className="text-muted-foreground">
          <Typed at={TYPE_AT} step={TYPE_STEP} text={TYPED_KEYWORD} />
        </span>
        <Typed at={REST_AT} step={TYPE_STEP} text={TYPED_REST} />
        <span className="relative">
          <span className="bg-primary inline-block h-4 w-px translate-y-0.5" />
          <motion.span
            variants={appear(OPEN_AT + 0.3)}
            className="text-muted-foreground/50"
          >
            {SUGGESTIONS[0]}
          </motion.span>
          <motion.div
            variants={pop(OPEN_AT, -4)}
            className="bg-popover ring-foreground/4 absolute top-8 left-0 w-44 origin-top-left overflow-hidden rounded-lg p-1 font-sans text-xs shadow-lg ring"
          >
            {SUGGESTIONS.map((suggestion, index) => (
              <motion.div
                key={suggestion}
                variants={rise(OPEN_AT + 0.05 + index * 0.04)}
                className={cn(
                  'flex h-7 items-center justify-between rounded-md px-2',
                  index === 0 && 'bg-primary/15'
                )}
              >
                <span className="font-mono">{suggestion}</span>
                <span className="text-muted-foreground">enum</span>
              </motion.div>
            ))}
          </motion.div>
        </span>
      </div>
    </div>
  </ProductCrop>
)
