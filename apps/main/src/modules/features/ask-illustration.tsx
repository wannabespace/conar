import {
  Cancel01Icon,
  ChatAdd01Icon,
  HistoryIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Bubble, BubbleContent } from '@tamery/ui/components/bubble'
import { Button } from '@tamery/ui/components/button'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tamery/ui/components/table'
import { motion } from 'motion/react'

import { ProductCrop } from './product-crop'
import { rise } from './variants'

const MotionTableRow = motion.create(TableRow)

const SQL = `SELECT customer, sum(total)
FROM orders
WHERE status = 'paid'
GROUP BY customer
ORDER BY 2 DESC`

const RESULTS = [
  ['Priya Raman', '$1,214.12'],
  ['Tomás Ferreira', '$608.65'],
  ['Mateo Álvarez', '$600.36'],
  ['Kenji Mori', '$592.24'],
]

export const AskIllustration = () => (
  <ProductCrop className="min-w-0">
    <div className="flex h-8 items-center gap-0.5 border-b pr-1 pl-3">
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        Top customers
      </span>
      {[HistoryIcon, ChatAdd01Icon, Cancel01Icon].map((icon, index) => (
        <Button key={index} variant="ghost-muted" size="icon-xs">
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5" />
        </Button>
      ))}
    </div>
    <div className="flex flex-col gap-4 px-3 py-4 text-sm">
      <motion.div variants={rise(0.1)} className="flex flex-col">
        <Bubble align="end" variant="muted">
          <BubbleContent>Who spent the most on paid orders?</BubbleContent>
        </Bubble>
      </motion.div>
      <motion.p variants={rise(0.35)} className="text-pretty">
        Priya Raman leads with two paid orders. I summed paid totals per
        customer:
      </motion.p>
      <motion.div variants={rise(0.5)}>
        <CodeBlock code={SQL} language="sql" size="xs" variant="field" />
      </motion.div>
      <motion.div variants={rise(0.65)}>
        <Table size="sm">
          <TableHeader>
            <TableRow>
              <TableHead>customer</TableHead>
              <TableHead>sum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RESULTS.map(([customer, total], index) => (
              <MotionTableRow
                key={customer}
                variants={rise(0.7 + index * 0.05)}
              >
                <TableCell>{customer}</TableCell>
                <TableCell variant="numeric">{total}</TableCell>
              </MotionTableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  </ProductCrop>
)
