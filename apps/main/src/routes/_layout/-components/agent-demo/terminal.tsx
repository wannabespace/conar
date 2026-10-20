import { cn } from '@tamery/ui/lib/utils'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { WindowButtons } from '~/components/product/window-buttons'

import {
  APPROVAL_STEP,
  DONE_STEP,
  ORDER_ID,
  UPDATE_SQL,
  UPDATED_STEP,
} from './script'

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
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
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

export const Terminal = ({ step }: { step: number }) => (
  <div className="bg-background ring-foreground/4 absolute top-0 left-0 flex w-full flex-col overflow-hidden rounded-xl shadow-xl ring sm:w-[62%]">
    <div className="relative flex h-9 shrink-0 items-center gap-2 border-b px-3">
      <WindowButtons muted />
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
