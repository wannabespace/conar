import { ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@tamery/ui/components/item'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import type { ReactElement, Ref } from 'react'

import type { GetStartedStep as Step } from './use-get-started-steps'

const StepMarker = ({ done, number }: { done: boolean; number: number }) => (
  <ItemMedia>
    <span
      className={cn(
        'text-2xs flex size-5 items-center justify-center rounded-full tabular-nums ring transition-colors duration-200',
        done
          ? 'bg-primary text-primary-foreground ring-primary'
          : 'text-muted-foreground ring-border'
      )}
    >
      {done ? (
        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3" />
      ) : (
        number
      )}
    </span>
  </ItemMedia>
)

const BlockedReason = ({
  children,
  reason,
}: {
  children: ReactElement
  reason: string | null
}) =>
  reason ? (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="left">{reason}</TooltipContent>
    </Tooltip>
  ) : (
    children
  )

export const GetStartedStep = ({
  actionRef,
  current,
  number,
  onRun,
  step,
}: {
  actionRef: Ref<HTMLButtonElement>
  current: boolean
  number: number
  onRun: (run: () => unknown) => void
  step: Step
}) => {
  const { action } = step
  const run = 'run' in action ? () => onRun(action.run) : null
  const blocked = 'blocked' in action ? action.blocked : null
  const title = (
    <ItemTitle>
      <span className={cn(step.done && 'text-muted-foreground')}>
        {step.title}
      </span>
    </ItemTitle>
  )

  if (current) {
    return (
      <Item size="xs" variant="active">
        <StepMarker done={step.done} number={number} />
        <ItemContent>
          {title}
          <ItemDescription>{step.description}</ItemDescription>
          <BlockedReason reason={blocked}>
            <Button
              ref={actionRef}
              size="xs"
              disabled={!run}
              focusableWhenDisabled
              data-step-target
              onClick={run ?? undefined}
              className="mt-2 self-start"
            >
              <HugeiconsIcon icon={action.icon} strokeWidth={2} />
              {action.label}
            </Button>
          </BlockedReason>
        </ItemContent>
      </Item>
    )
  }

  return (
    <BlockedReason reason={blocked}>
      <Item
        size="xs"
        className={cn(!run && 'opacity-50')}
        render={
          <button
            type="button"
            tabIndex={-1}
            aria-label={step.title}
            aria-disabled={!run}
            data-step-target
            onClick={run ?? undefined}
          />
        }
      >
        <StepMarker done={step.done} number={number} />
        <ItemContent>{title}</ItemContent>
        <ItemActions>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="text-muted-foreground size-3.5"
          />
        </ItemActions>
      </Item>
    </BlockedReason>
  )
}
