import { CommandIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

import type { ProtectedModule } from '~/lib/module'

import { actionCenterOpen } from './action-center-open'
import { ActionsCenter } from './actions-center'

const CommandPaletteButton = () => (
  <Tooltip>
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
    <TooltipContent side="bottom">
      Command palette
      <KbdCtrlLetter userAgent={navigator.userAgent} letter="P" />
    </TooltipContent>
  </Tooltip>
)

export default {
  mounts: [ActionsCenter],
  titlebar: [{ Component: CommandPaletteButton, order: 90 }],
} satisfies ProtectedModule
