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

import { checkOrUpgrade } from '~/core/user/permissions'
import { useIsAnonymous } from '~/lib/auth'
import { posthog } from '~/lib/posthog'

import { chatOpen } from './stores'

export const toggleChat = (resourceId: string) => {
  if (!checkOrUpgrade('ai.chat.use')) {
    return
  }

  chatOpen(resourceId).set((opened) => !opened)
  posthog.capture('ai_chat_toggled')
}

export const ChatToggle = ({ resourceId }: { resourceId: string }) => {
  const isGuest = useIsAnonymous()
  const toggle = () => toggleChat(resourceId)

  useHotkey('Mod+L', (e) => {
    e.preventDefault()
    toggle()
  })

  return (
    <Tooltip
      shortcut={<KbdCtrlLetter userAgent={navigator.userAgent} letter="L" />}
    >
      <TooltipTrigger
        render={
          <Button
            variant="ghost-muted"
            size="icon-xs"
            aria-label="AI chat"
            className={isGuest ? 'opacity-50' : undefined}
            onClick={toggle}
          />
        }
      >
        <HugeiconsIcon icon={AiChat01Icon} strokeWidth={2} />
      </TooltipTrigger>
      <TooltipContent side="bottom">AI chat</TooltipContent>
    </Tooltip>
  )
}
