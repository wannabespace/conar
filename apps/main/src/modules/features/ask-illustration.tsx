import { motion } from 'motion/react'

import { ResultsTable } from './results-table'
import { rise } from './variants'

const SQL = [
  ['SELECT', 'customer, sum(total)'],
  ['FROM', 'orders'],
  ['WHERE', "created_at >= '2026-10-01'"],
  ['GROUP BY', 'customer'],
  ['ORDER BY', '2 DESC'],
]

const RESULTS = [
  ['Priya Raman', '$1,240.00'],
  ['Emma Laurent', '$960.40'],
  ['Léa Martin', '$512.75'],
  ['Anna Kowalska', '$430.00'],
]

export const AskIllustration = () => (
  <div className="absolute inset-0 flex flex-col justify-end gap-3 p-6">
    <div className="hidden flex-col gap-3 mask-t-from-60% md:flex">
      <p className="bg-secondary max-w-4/5 self-end rounded-2xl rounded-br-md px-3.5 py-2 text-sm">
        Why is this query so slow?
      </p>
      <p className="max-w-4/5 text-sm text-pretty">
        orders has no index on created_at, so every run scans the whole table.
        Adding one fixes it:
      </p>
      <pre className="bg-popover ring-foreground/4 truncate rounded-xl p-3 font-mono text-xs ring">
        <span className="text-muted-foreground">CREATE INDEX</span> ON orders
        (created_at)
      </pre>
    </div>
    <motion.p
      variants={rise(0)}
      className="bg-primary text-primary-foreground max-w-4/5 self-end rounded-2xl rounded-br-md px-3.5 py-2 text-sm"
    >
      Who spent the most this month?
    </motion.p>
    <motion.pre
      variants={rise(0.35)}
      className="bg-popover ring-foreground/4 overflow-hidden rounded-xl p-3 font-mono text-xs/5 shadow-sm ring"
    >
      {SQL.map(([keyword, rest]) => (
        <div key={keyword} className="truncate">
          <span className="text-muted-foreground">{keyword}</span> {rest}
        </div>
      ))}
    </motion.pre>
    <ResultsTable at={0.75} rows={RESULTS} />
  </div>
)
