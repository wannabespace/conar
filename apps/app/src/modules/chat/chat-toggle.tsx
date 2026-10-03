import { AiChat01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useHotkey } from '@tanstack/react-hotkeys'

import { usePermissions } from '~/core/user/permissions'
import { useIsAnonymous } from '~/lib/auth'
import { requestAccess } from '~/store'

import { chatOpen } from './stores'

export const toggleChat = (resourceId: string, canUseChat: boolean) => {
  if (!canUseChat) {
    requestAccess('ai')
    return
  }

  chatOpen(resourceId).set((opened) => !opened)
}

export const ChatToggle = ({ resourceId }: { resourceId: string }) => {
  const canUseChat = usePermissions().check('ai.chat.use')
  const isGuest = useIsAnonymous()
  const toggle = () => toggleChat(resourceId, canUseChat)

  useHotkey('Mod+L', (e) => {
    e.preventDefault()
    toggle()
  })

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost-muted"
            size="icon-xs"
            aria-label="AI chat"
            disabled={isGuest}
            focusableWhenDisabled
            data-guest-locked={isGuest ? 'ai' : undefined}
            onClick={toggle}
          />
        }
      >
        <HugeiconsIcon icon={AiChat01Icon} strokeWidth={2} />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        AI chat
        <KbdCtrlLetter userAgent={navigator.userAgent} letter="L" />
      </TooltipContent>
    </Tooltip>
  )
}
