import { CommandIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

import { actionCenterOpen } from './action-center-open'

export const CommandPaletteButton = () => (
  <Tooltip
    shortcut={<KbdCtrlLetter userAgent={navigator.userAgent} letter="P" />}
  >
    <TooltipTrigger
      render={
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Command palette"
          onClick={() => actionCenterOpen.set(true)}
        />
      }
    >
      <HugeiconsIcon icon={CommandIcon} strokeWidth={2} className="size-4" />
    </TooltipTrigger>
    <TooltipContent side="bottom">Command palette</TooltipContent>
  </Tooltip>
)
