import {
  ArrowUp02Icon,
  Cancel01Icon,
  ChatAdd01Icon,
  HistoryIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Bubble, BubbleContent } from '@tamery/ui/components/bubble'
import { Button } from '@tamery/ui/components/button'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import {
  InputGroup,
  InputGroupButton,
  InputGroupTextarea,
} from '@tamery/ui/components/input-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tamery/ui/components/table'
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { HOUSE_EASE } from '~/utils/motion'

const CONVERSATIONS = [
  {
    answer:
      'Pro customers bring in the most, more than three times the team plan. I joined orders to users and summed this month’s totals:',
    columns: ['plan', 'sum'],
    question: 'Which plan brings the most revenue this month?',
    rows: [
      ['pro', '$9,412.40'],
      ['team', '$2,768.15'],
      ['free', '$1,205.90'],
    ],
    sql: `SELECT u.plan, sum(o.total)
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.created_at >=
  date_trunc('month', now())
GROUP BY 1 ORDER BY 2 DESC`,
    title: 'Revenue by plan',
  },
  {
    answer:
      'Four orders are still pending. The oldest has waited since September 12:',
    columns: ['id', 'created_at'],
    question: 'Which orders are still pending?',
    rows: [
      ['58303', '2026-09-12'],
      ['58309', '2026-09-15'],
      ['58328', '2026-09-24'],
      ['58334', '2026-09-27'],
    ],
    sql: `SELECT id, created_at
FROM orders
WHERE status = 'pending'
ORDER BY created_at`,
    title: 'Pending orders',
  },
  {
    answer:
      '4.1% of orders were refunded this quarter, up from 3.2% in the last one. I averaged refunds per quarter:',
    columns: ['quarter', 'rate'],
    question: 'Are refunds going up?',
    rows: [
      ['2026-07-01', '0.041'],
      ['2026-04-01', '0.032'],
      ['2026-01-01', '0.029'],
    ],
    sql: `SELECT date_trunc('quarter', created_at),
  avg((status = 'refunded')::int)
FROM orders
GROUP BY 1 ORDER BY 1 DESC
LIMIT 3`,
    title: 'Refund rate',
  },
] as const

type Conversation = (typeof CONVERSATIONS)[number]

const TICK_MS = 40
const SEND_PAUSE_TICKS = 10
const TICKS_PER_WORD = 2
const SQL_DELAY_TICKS = 4
const RESULT_DELAY_TICKS = 14
const HOLD_TICKS = 125

const timeline = (conversation: Conversation) => {
  const sent = conversation.question.length + SEND_PAUSE_TICKS
  const answered = sent + conversation.answer.split(' ').length * TICKS_PER_WORD
  return {
    answered,
    end: answered + RESULT_DELAY_TICKS + HOLD_TICKS,
    sent,
  }
}

const settledTick = (conversation: Conversation) =>
  timeline(conversation).end - HOLD_TICKS

const usePlayback = (playing: boolean) => {
  const [state, setState] = useState<{
    conversation: Conversation
    tick: number
  }>(() => ({
    conversation: CONVERSATIONS[0],
    tick: settledTick(CONVERSATIONS[0]),
  }))

  useEffect(() => {
    if (!playing) {
      return
    }
    const interval = setInterval(
      () =>
        setState(({ conversation, tick }) =>
          tick < timeline(conversation).end
            ? { conversation, tick: tick + 1 }
            : {
                conversation:
                  CONVERSATIONS[
                    (CONVERSATIONS.indexOf(conversation) + 1) %
                      CONVERSATIONS.length
                  ] ?? CONVERSATIONS[0],
                tick: 0,
              }
        ),
      TICK_MS
    )
    return () => clearInterval(interval)
  }, [playing])

  return state
}

const rise = {
  animate: { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 6 },
  transition: { duration: 0.3, ease: HOUSE_EASE },
}

const Answer = ({
  conversation,
  tick,
}: {
  conversation: Conversation
  tick: number
}) => {
  const { answered, sent } = timeline(conversation)
  const words = conversation.answer.split(' ')

  return (
    <>
      {tick >= sent && (
        <motion.div {...rise} className="flex flex-col">
          <Bubble align="end" variant="muted">
            <BubbleContent>{conversation.question}</BubbleContent>
          </Bubble>
        </motion.div>
      )}
      <div className="flex flex-col gap-3">
        <p className="text-pretty">
          {words
            .slice(0, Math.max(0, (tick - sent) / TICKS_PER_WORD))
            .join(' ')}
        </p>
        {tick >= answered + SQL_DELAY_TICKS && (
          <motion.div {...rise}>
            <CodeBlock
              code={conversation.sql}
              language="sql"
              size="xs"
              variant="field"
            />
          </motion.div>
        )}
        {tick >= answered + RESULT_DELAY_TICKS && (
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

export const ChatPanel = () => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const reduceMotion = useReducedMotion()
  const { conversation, tick } = usePlayback(inView && !reduceMotion)
  const { sent } = timeline(conversation)

  return (
    <div ref={ref} className="flex h-full w-72 shrink-0 flex-col pl-1.5">
      <div className="bg-background ring-foreground/4 flex h-full flex-col overflow-hidden rounded-xl ring">
        <div className="flex h-8 shrink-0 items-center gap-0.5 border-b pr-1 pl-3">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {conversation.title}
          </span>
          {[HistoryIcon, ChatAdd01Icon, Cancel01Icon].map((icon, iconIndex) => (
            <Button key={iconIndex} variant="ghost-muted" size="icon-xs">
              <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5" />
            </Button>
          ))}
        </div>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={conversation.title}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-3 py-3 text-sm"
          >
            <Answer conversation={conversation} tick={tick} />
          </motion.div>
        </AnimatePresence>
        <div className="shrink-0 p-2">
          <InputGroup className="relative">
            <InputGroupTextarea
              readOnly
              rows={1}
              value={tick < sent ? conversation.question.slice(0, tick) : ''}
              placeholder="Ask about your database…"
              className="min-h-20 pb-9"
            />
            <div className="absolute right-1.5 bottom-1.5">
              <InputGroupButton size="icon-round" variant="default">
                <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2} />
              </InputGroupButton>
            </div>
          </InputGroup>
        </div>
      </div>
    </div>
  )
}
