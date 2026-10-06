import { ArrowTurnBackwardIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'

export const DiscardButton = ({
  className,
  disabled,
  label,
  onClick,
}: {
  className?: string
  disabled: boolean
  label: string
  onClick: () => void
}) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Button
          variant="ghost-muted"
          size="icon-xs"
          aria-label={label}
          className={cn('shrink-0', className)}
          onClick={onClick}
          disabled={disabled}
        />
      }
    >
      <HugeiconsIcon icon={ArrowTurnBackwardIcon} strokeWidth={2} />
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
)
