import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@tamery/ui/components/button'
import { IconButton } from '@tamery/ui/components/custom/icon-button'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import { cn } from '@tamery/ui/lib/utils'
import { useRef, useState } from 'react'

import { posthog } from '~/lib/posthog'

import { GetStartedList } from './get-started-list'
import { getStarted } from './progress'
import { useGetStartedSteps } from './use-get-started-steps'

export const GetStartedButton = () => {
  const { dismissed, steps } = useGetStartedSteps()
  const [open, setOpen] = useState(false)
  const actionRef = useRef<HTMLButtonElement>(null)

  const doneCount = steps.filter((step) => step.done).length
  const current = steps.find((step) => !step.done)
  if (dismissed || !current) {
    return null
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          posthog.capture('get_started_opened', { done: doneCount })
        }
      }}
    >
      <PopoverTrigger render={<Button variant="ghost" size="sm" />}>
        Get started
        <span className="text-muted-foreground tabular-nums">
          {doneCount}/{steps.length}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" initialFocus={actionRef} className="w-80">
        <PopoverHeader>
          <div className="flex items-center justify-between">
            <PopoverTitle>Get started</PopoverTitle>
            <IconButton
              variant="ghost-muted"
              size="icon-xs"
              icon={Cancel01Icon}
              label="Dismiss"
              onClick={() => {
                posthog.capture('get_started_dismissed', { done: doneCount })
                getStarted.dismiss()
              }}
            />
          </div>
          <div className="flex items-center gap-1">
            {steps.map((step) => (
              <span
                key={step.id}
                aria-hidden
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors duration-300',
                  step.done ? 'bg-primary' : 'bg-secondary'
                )}
              />
            ))}
            <span className="text-muted-foreground ml-2 text-xs tabular-nums">
              {doneCount} of {steps.length}
            </span>
          </div>
        </PopoverHeader>
        <GetStartedList
          steps={steps}
          current={current}
          actionRef={actionRef}
          onRun={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}
