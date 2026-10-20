import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'

import { pop } from './variants'

const LINES = [
  ['SELECT', ' id, customer, total'],
  ['FROM', ' orders'],
  ['WHERE', ' status = '],
]

const SUGGESTIONS = ["'paid'", "'pending'", "'refunded'"]

export const CompletionIllustration = () => (
  <div className="absolute inset-0 flex items-start px-6 pt-3">
    <div className="bg-popover ring-foreground/4 w-full rounded-xl py-2 font-mono text-sm/7 shadow-md ring">
      {LINES.map(([keyword, rest], index) => (
        <div key={keyword} className="flex">
          <span className="text-muted-foreground/60 w-10 shrink-0 pr-3 text-right">
            {index + 1}
          </span>
          <span className="text-muted-foreground">{keyword}</span>
          <span className="whitespace-pre">{rest}</span>
          {index === LINES.length - 1 && (
            <span className="relative">
              <span className="bg-primary inline-block h-4 w-px translate-y-0.5 animate-pulse motion-reduce:animate-none" />
              <motion.div
                variants={pop(0.4, -4)}
                className="bg-popover ring-foreground/4 absolute top-8 left-0 w-36 origin-top-left overflow-hidden rounded-lg p-1 font-sans text-xs shadow-lg ring"
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
  </div>
)
