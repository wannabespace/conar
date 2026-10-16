import { ArrowTurnBackwardIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toError } from '@tamery/shared/utils'
import { Button } from '@tamery/ui/components/button'
import { Separator } from '@tamery/ui/components/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { Result } from 'better-result'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { useRunnerTab } from '../lib/store'
import { runnerTransaction } from '../lib/transaction'

const endings = {
  commit: {
    done: 'Transaction committed',
    icon: Tick02Icon,
    label: 'Commit',
    tooltip: 'Save the changes made since BEGIN',
  },
  rollback: {
    done: 'Transaction rolled back',
    icon: ArrowTurnBackwardIcon,
    label: 'Rollback',
    tooltip: 'Discard the changes made since BEGIN',
  },
} as const

export const TransactionControls = () => {
  const tab = useRunnerTab()
  const open = useSubscription(runnerTransaction.state(tab))

  if (!open) {
    return null
  }

  const end = async (reason: keyof typeof endings) => {
    const result = await Result.tryPromise(() =>
      runnerTransaction.close(tab, reason)
    )
    if (result.isErr()) {
      toast.error(toError(result.error.cause).message)
    } else {
      toast.success(endings[reason].done)
    }
  }

  return (
    <>
      <Separator orientation="vertical" className="mx-0.5 h-4!" />
      {(['commit', 'rollback'] as const).map((reason) => (
        <Tooltip key={reason}>
          <TooltipTrigger
            render={
              <Button size="sm" variant="outline" onClick={() => end(reason)} />
            }
          >
            <HugeiconsIcon icon={endings[reason].icon} strokeWidth={2} />
            {endings[reason].label}
          </TooltipTrigger>
          <TooltipContent>{endings[reason].tooltip}</TooltipContent>
        </Tooltip>
      ))}
    </>
  )
}
