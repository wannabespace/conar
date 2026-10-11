import {
  ArrowRight01Icon,
  Key01Icon,
  SquareLock02Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { Badge } from '@tamery/ui/components/badge'
import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { Button } from '@tamery/ui/components/button'
import { CodeBlock } from '@tamery/ui/components/custom/code-block'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { cn } from '@tamery/ui/lib/utils'
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'motion/react'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import { Reveal } from '~/components/reveal'
import { HOUSE_EASE } from '~/utils/motion'

const POINTS = [
  {
    description:
      'Agents list tables, describe them and run read-only queries without asking.',
    icon: ViewIcon,
    title: 'Reads run freely',
  },
  {
    description:
      'Every write opens a dialog in Tamery. Nothing the agent sent runs before you press Run.',
    icon: SquareLock02Icon,
    title: 'Writes wait for you',
  },
  {
    description:
      'Agents get a token, never your connection strings. Pick what each connection allows.',
    icon: Key01Icon,
    title: 'Strings stay in Tamery',
  },
]

const ORDER_ID = '58309'
const UPDATE_SQL = `UPDATE orders SET status = 'refunded' WHERE id = ${ORDER_ID}`

const ORDERS = [
  ['58340', 'Priya Raman', '$608.94', 'paid'],
  ['58307', 'Tomás Ferreira', '$608.65', 'paid'],
  [ORDER_ID, 'Daniel Okafor', '$605.91', 'pending'],
  ['58305', 'Mateo Álvarez', '$600.36', 'paid'],
  ['58311', 'Kenji Mori', '$592.24', 'paid'],
  ['58336', 'Hana Kobayashi', '$584.86', 'paid'],
  ['58303', 'Oskar Lindqvist', '$581.35', 'pending'],
]

const STATUS_DOTS: Record<string, string> = {
  paid: 'bg-success',
  pending: 'bg-warning',
  refunded: 'bg-destructive',
}

const STEP_MS = [900, 700, 900, 600, 2200, 350, 900, 4200]
const APPROVAL_STEP = 4
const RUN_PRESS_STEP = 5
const UPDATED_STEP = 6
const DONE_STEP = 7

const useStep = (playing: boolean) => {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!playing) {
      return
    }
    const timeout = setTimeout(
      () => setStep((step + 1) % STEP_MS.length),
      STEP_MS[step]
    )
    return () => clearTimeout(timeout)
  }, [playing, step])

  return step
}

const Line = ({
  children,
  className,
  show,
}: {
  children: ReactNode
  className?: string
  show: boolean
}) =>
  show && (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: HOUSE_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )

const ToolCall = ({ name, sql }: { name: string; sql: string }) => (
  <>
    <div>
      <span className="text-primary">⏺</span> tamery · {name}
      <span className="text-muted-foreground"> (MCP)</span>
    </div>
    <div className="text-muted-foreground truncate pl-4">⎿ {sql}</div>
  </>
)

const Terminal = ({ step }: { step: number }) => (
  <div className="bg-background ring-foreground/4 absolute top-0 left-0 flex w-full flex-col overflow-hidden rounded-xl shadow-xl ring sm:w-[62%]">
    <div className="relative flex h-9 shrink-0 items-center gap-2 border-b px-3">
      <span className="bg-foreground/12 size-3 rounded-full" />
      <span className="bg-foreground/12 size-3 rounded-full" />
      <span className="bg-foreground/12 size-3 rounded-full" />
      <span className="text-muted-foreground absolute inset-x-0 text-center text-xs">
        claude — storefront
      </span>
    </div>
    <div className="flex min-h-72 flex-col gap-3 p-4 font-mono text-xs/5">
      <Line show>
        <span className="text-muted-foreground">&gt;</span> Refund order{' '}
        {ORDER_ID}, the customer cancelled
      </Line>
      <Line show={step >= 1}>
        <ToolCall
          name="query"
          sql={`SELECT status FROM orders WHERE id = ${ORDER_ID}`}
        />
        <Line show={step >= 2} className="text-muted-foreground pl-4">
          ⎿ 1 row · pending
        </Line>
      </Line>
      <Line show={step >= 3}>
        <ToolCall name="execute" sql={UPDATE_SQL} />
        <Line
          show={step >= APPROVAL_STEP}
          className={cn(
            'text-muted-foreground pl-4',
            step < UPDATED_STEP && 'animate-pulse'
          )}
        >
          ⎿{' '}
          {step < UPDATED_STEP
            ? 'Waiting for approval in Tamery…'
            : '1 row updated'}
        </Line>
      </Line>
      <Line show={step >= DONE_STEP} className="font-sans text-sm">
        Done. Order {ORDER_ID} is refunded.
      </Line>
    </div>
  </div>
)

const cellClassName = 'flex h-full shrink-0 items-center border-r px-2.5'

const OrdersGrid = ({ refunded }: { refunded: boolean }) => (
  <div className="bg-background ring-foreground/4 overflow-hidden rounded-lg text-xs ring">
    <div className="text-muted-foreground flex h-8 border-b font-medium">
      <div className={cn(cellClassName, 'w-16')}>id</div>
      <div className={cn(cellClassName, 'min-w-0 flex-1')}>customer</div>
      <div className={cn(cellClassName, 'hidden w-20 sm:flex')}>total</div>
      <div className={cn(cellClassName, 'w-28 border-r-0')}>status</div>
    </div>
    {ORDERS.map(([id, customer, total, initialStatus = '']) => {
      const isTarget = id === ORDER_ID
      const status = isTarget && refunded ? 'refunded' : initialStatus
      return (
        <div key={id} className="flex h-8 border-b last:border-b-0">
          <div className={cn(cellClassName, 'w-16 tabular-nums')}>{id}</div>
          <div className={cn(cellClassName, 'min-w-0 flex-1 truncate')}>
            {customer}
          </div>
          <div
            className={cn(cellClassName, 'hidden w-20 tabular-nums sm:flex')}
          >
            {total}
          </div>
          <div className={cn(cellClassName, 'relative w-28 border-r-0')}>
            {isTarget && refunded && (
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="bg-primary/20 absolute inset-0"
              />
            )}
            <Badge variant="secondary" className="relative">
              <span
                className={cn('size-1.5 rounded-full', STATUS_DOTS[status])}
              />
              {status}
            </Badge>
          </div>
        </div>
      )
    })}
  </div>
)

const ApprovalDialog = ({ pressed }: { pressed: boolean }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.15 } }}
    className="absolute inset-0 flex items-start justify-center bg-black/30 p-4 backdrop-blur-sm"
  >
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: HOUSE_EASE }}
      className="bg-card ring-foreground/4 flex w-full max-w-88 flex-col gap-3 rounded-2xl p-4 shadow-xl ring"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Run this statement?</span>
        <p className="text-muted-foreground text-xs text-pretty">
          An agent wants to run it on{' '}
          <span className="text-foreground font-medium">storefront</span>{' '}
          through MCP. It commits and cannot be undone.
        </p>
      </div>
      <CodeBlock
        code={UPDATE_SQL}
        language="sql"
        size="xs"
        variant="field"
        wrap
      />
      <p className="text-muted-foreground text-xs">
        The database estimates it changes about 1 row.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          Decline
        </Button>
        <motion.div
          animate={{ scale: pressed ? 0.94 : 1 }}
          transition={{ duration: 0.15 }}
        >
          <Button variant="warning" size="sm">
            Run
          </Button>
        </motion.div>
      </div>
    </motion.div>
  </motion.div>
)

const TameryWindow = ({ step }: { step: number }) => (
  <div className="bg-body ring-foreground/4 absolute top-68 right-0 left-6 flex flex-col overflow-hidden rounded-xl shadow-2xl ring sm:top-16 sm:left-auto sm:w-[58%]">
    <div className="bg-card flex h-9 shrink-0 items-center gap-3 border-b px-3 text-xs">
      <div className="flex shrink-0 gap-2">
        <span className="bg-destructive size-3 rounded-full" />
        <span className="bg-warning size-3 rounded-full" />
        <span className="bg-success size-3 rounded-full" />
      </div>
      <AppLogo className="text-primary size-4" />
      <span className="flex min-w-0 items-center gap-1.5">
        <ConnectionIcon type={ConnectionType.Postgres} className="size-3.5" />
        storefront
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className="text-muted-foreground/40 size-3.5"
        />
        orders
      </span>
    </div>
    <div className="relative p-1.5">
      <OrdersGrid refunded={step >= UPDATED_STEP} />
      <AnimatePresence>
        {step >= APPROVAL_STEP && step < UPDATED_STEP && (
          <ApprovalDialog pressed={step === RUN_PRESS_STEP} />
        )}
      </AnimatePresence>
    </div>
  </div>
)

const AgentDemo = () => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const reduceMotion = useReducedMotion()
  const playingStep = useStep(inView && !reduceMotion)
  const step = reduceMotion ? APPROVAL_STEP : playingStep

  return (
    // A mask clips to its own box, so it reaches past the windows' shadows; the layout root clips the overflow
    <div className="-mx-20 mask-b-from-85% px-20 sm:mask-b-from-80%">
      <div
        ref={ref}
        inert
        aria-hidden
        className="relative h-152 select-none sm:h-104"
      >
        <Terminal step={step} />
        <TameryWindow step={step} />
      </div>
    </div>
  )
}

export const Agents = () => (
  <section
    id="agents"
    aria-labelledby="agents-heading"
    className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6"
  >
    <Reveal className="grid gap-6 md:grid-cols-2 md:items-end">
      <h2
        id="agents-heading"
        className="max-w-lg text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl"
      >
        Your agents query. You approve the writes.
      </h2>
      <p className="text-muted-foreground max-w-md text-lg text-pretty md:justify-self-end">
        Claude Code, Cursor and other MCP clients reach your databases through
        the desktop app. By default, every write waits for your approval.
      </p>
    </Reveal>
    <Reveal className="mt-14">
      <AgentDemo />
    </Reveal>
    <Reveal className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-0">
      {POINTS.map((point) => (
        <div
          key={point.title}
          className="flex flex-col gap-2 sm:border-l sm:px-6 first:sm:border-l-0 first:sm:pl-0"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <HugeiconsIcon
              icon={point.icon}
              strokeWidth={2}
              className="text-muted-foreground size-4"
            />
            {point.title}
          </span>
          <p className="text-muted-foreground text-sm text-pretty">
            {point.description}
          </p>
        </div>
      ))}
    </Reveal>
  </section>
)
