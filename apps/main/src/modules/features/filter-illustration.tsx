import { CommandIcon, Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Kbd } from '@tamery/ui/components/kbd'
import type { Variants } from 'motion/react'
import { motion } from 'motion/react'

import { FilterChip } from '~/components/filter-chip'

import { ResultsTable } from './results-table'

const SENTENCE = 'paid orders over $200 from Germany'

const FILTERS = [
  { column: 'status', operator: 'is', value: 'paid' },
  { column: 'total', operator: 'over', value: '200' },
  { column: 'country', operator: 'is', value: 'Germany' },
]

const RESULTS = [
  ['Lukas Becker', 'Germany', '$412.00'],
  ['Mia Schneider', 'Germany', '$268.50'],
  ['Jonas Weber', 'Germany', '$230.00'],
]

const TYPE_AT = 0.2
const SECONDS_PER_CHAR = 0.035
const CONVERT_AT = TYPE_AT + SENTENCE.length * SECONDS_PER_CHAR + 0.4

const appear = (delay: number): Variants => ({
  hidden: { opacity: 0, scale: 0.9 },
  shown: {
    opacity: 1,
    scale: 1,
    transition: { bounce: 0.3, delay, duration: 0.45, type: 'spring' },
  },
})

export const FilterIllustration = () => (
  <div className="absolute inset-0 flex flex-col gap-3 p-6">
    <div className="bg-input ring-foreground/4 flex h-10 w-full items-center gap-2 rounded-xl pr-2 pl-3 shadow-sm ring">
      <HugeiconsIcon
        icon={Search01Icon}
        strokeWidth={2}
        className="text-muted-foreground size-4 shrink-0"
      />
      <div className="relative flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        <motion.span
          variants={{
            hidden: { opacity: 1 },
            shown: {
              opacity: 0,
              transition: { delay: CONVERT_AT, duration: 0.15 },
            },
          }}
          className="absolute inset-y-0 left-0 flex items-center text-sm whitespace-pre"
        >
          {[...SENTENCE].map((char, index) => (
            <motion.span
              key={index}
              variants={{
                hidden: { opacity: 0 },
                shown: {
                  opacity: 1,
                  transition: {
                    delay: TYPE_AT + index * SECONDS_PER_CHAR,
                    duration: 0,
                  },
                },
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
        {FILTERS.map((filter, index) => (
          <motion.span
            key={filter.column}
            variants={appear(CONVERT_AT + 0.1 + index * 0.08)}
          >
            <FilterChip {...filter} />
          </motion.span>
        ))}
        <motion.span
          variants={appear(CONVERT_AT + 0.4)}
          className="text-muted-foreground truncate pl-1 text-sm"
        >
          Filter or ask AI…
        </motion.span>
      </div>
      <Kbd>
        <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />F
      </Kbd>
    </div>
    <ResultsTable at={CONVERT_AT + 0.4} rows={RESULTS} />
  </div>
)
