import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { AnimatePresence } from 'motion/react'

import { WindowButtons } from '../window-buttons'
import { ApprovalDialog } from './approval-dialog'
import { OrdersGrid } from './orders-grid'
import { APPROVAL_STEP, RUN_PRESS_STEP, UPDATED_STEP } from './script'

export const TameryWindow = ({ step }: { step: number }) => (
  <div className="bg-body ring-foreground/4 absolute top-68 right-0 left-6 flex flex-col overflow-hidden rounded-xl shadow-2xl ring sm:top-16 sm:left-auto sm:w-[58%]">
    <div className="bg-card flex h-9 shrink-0 items-center gap-3 border-b px-3 text-xs">
      <WindowButtons />
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
