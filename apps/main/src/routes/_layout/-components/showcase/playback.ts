import { useEffect, useState } from 'react'

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

export type Conversation = (typeof CONVERSATIONS)[number]

const TICK_MS = 40
const SEND_PAUSE_TICKS = 10
export const TICKS_PER_WORD = 2
const SQL_DELAY_TICKS = 4
const RESULT_DELAY_TICKS = 14
const HOLD_TICKS = 125

export const timeline = (conversation: Conversation) => {
  const sentAt = conversation.question.length + SEND_PAUSE_TICKS
  const answered =
    sentAt + conversation.answer.split(' ').length * TICKS_PER_WORD
  return {
    end: answered + RESULT_DELAY_TICKS + HOLD_TICKS,
    resultAt: answered + RESULT_DELAY_TICKS,
    sentAt,
    sqlAt: answered + SQL_DELAY_TICKS,
  }
}

export const usePlayback = (playing: boolean) => {
  const [state, setState] = useState<{
    conversation: Conversation
    tick: number
  }>(() => ({
    conversation: CONVERSATIONS[0],
    tick: timeline(CONVERSATIONS[0]).resultAt,
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
