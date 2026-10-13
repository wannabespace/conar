import { cardClass } from '@tamery/ui/components/card.utils'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@tamery/ui/components/table'
import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'

import { rise } from './variants'

const MotionTableRow = motion.create(TableRow)

export const ResultsTable = ({
  at,
  rows,
}: {
  at: number
  rows: string[][]
}) => (
  <motion.div variants={rise(at)} className={cn(cardClass, 'overflow-hidden')}>
    <Table size="sm">
      <TableBody>
        {rows.map(([label, ...values], index) => (
          <MotionTableRow key={label} variants={rise(at + 0.1 + index * 0.06)}>
            <TableCell className="w-full">{label}</TableCell>
            {values.map((value) => (
              <TableCell key={value} variant="numeric">
                {value}
              </TableCell>
            ))}
          </MotionTableRow>
        ))}
      </TableBody>
    </Table>
  </motion.div>
)
