import { Bubble, BubbleContent } from '@tamery/ui/components/bubble'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { motion } from 'motion/react'

import { ResultsTable } from './results-table'
import { rise } from './variants'

const SQL = `SELECT customer, sum(total)
FROM orders
WHERE created_at >= '2026-10-01'
GROUP BY customer
ORDER BY 2 DESC`

const RESULTS = [
  ['Priya Raman', '$1,240.00'],
  ['Emma Laurent', '$960.40'],
  ['Léa Martin', '$512.75'],
  ['Anna Kowalska', '$430.00'],
]

export const AskIllustration = () => (
  <div className="absolute inset-0 flex flex-col justify-end gap-3 p-6">
    <div className="hidden flex-col gap-3 mask-t-from-60% md:flex">
      <Bubble align="end" variant="secondary">
        <BubbleContent>Why is this query so slow?</BubbleContent>
      </Bubble>
      <p className="max-w-4/5 text-sm text-pretty">
        orders has no index on created_at, so every run scans the whole table.
        Adding one fixes it:
      </p>
      <CodeBlock
        code="CREATE INDEX ON orders (created_at)"
        language="sql"
        size="xs"
        variant="field"
      />
    </div>
    <motion.div variants={rise(0)} className="flex flex-col">
      <Bubble align="end">
        <BubbleContent>Who spent the most this month?</BubbleContent>
      </Bubble>
    </motion.div>
    <motion.div variants={rise(0.35)}>
      <CodeBlock code={SQL} language="sql" size="xs" variant="field" />
    </motion.div>
    <ResultsTable at={0.75} rows={RESULTS} />
  </div>
)
