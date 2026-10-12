import { Bubble, BubbleContent } from '@tamery/ui/components/bubble'
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

import { HOUSE_EASE } from '~/utils/motion'

import type { Conversation } from './playback'
import { TICKS_PER_WORD, timeline } from './playback'

const rise = {
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 6 },
  transition: { duration: 0.3, ease: HOUSE_EASE },
}

export const Answer = ({
  conversation,
  tick,
}: {
  conversation: Conversation
  tick: number
}) => {
  const { resultAt, sentAt, sqlAt } = timeline(conversation)
  const words = conversation.answer.split(' ')

  return (
    <>
      {tick >= sentAt && (
        <motion.div {...rise} className="flex flex-col">
          <Bubble align="end" variant="muted">
            <BubbleContent>{conversation.question}</BubbleContent>
          </Bubble>
        </motion.div>
      )}
      <div className="flex flex-col gap-3">
        <p className="text-pretty">
          {words
            .slice(0, Math.max(0, (tick - sentAt) / TICKS_PER_WORD))
            .join(' ')}
        </p>
        {tick >= sqlAt && (
          <motion.div {...rise}>
            <CodeBlock
              code={conversation.sql}
              language="sql"
              size="xs"
              variant="field"
            />
          </motion.div>
        )}
        {tick >= resultAt && (
          <motion.div {...rise}>
            <Table size="sm">
              <TableHeader>
                <TableRow>
                  {conversation.columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversation.rows.map(([label, value]) => (
                  <TableRow key={label}>
                    <TableCell>{label}</TableCell>
                    <TableCell variant="numeric">{value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </div>
    </>
  )
}
