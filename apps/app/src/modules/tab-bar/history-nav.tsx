import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useCanGoBack, useRouter } from '@tanstack/react-router'

export const HistoryNav = () => {
  const router = useRouter()
  const canGoBack = useCanGoBack()

  if (!window.electron) {
    return null
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              size="icon-xs"
              aria-label="Go back"
              disabled={!canGoBack}
              onClick={() => router.history.back()}
            />
          }
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
        </TooltipTrigger>
        <TooltipContent side="bottom">Back</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              size="icon-xs"
              aria-label="Go forward"
              onClick={() => router.history.forward()}
            />
          }
        >
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
        </TooltipTrigger>
        <TooltipContent side="bottom">Forward</TooltipContent>
      </Tooltip>
    </>
  )
}
