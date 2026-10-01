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

import { useSubscription as useUserSubscription } from '~/core/user/use-subscription'
import { setIsSubscriptionDialogOpen } from '~/store'

import { chatOpen } from './stores'

export const toggleChat = (resourceId: string, canUseChat: boolean) => {
  if (!canUseChat) {
    setIsSubscriptionDialogOpen(true)
    return
  }

  chatOpen(resourceId).set((opened) => !opened)
}

export const ChatToggle = ({ resourceId }: { resourceId: string }) => {
  const { isPending, subscription } = useUserSubscription()
  const toggle = () => toggleChat(resourceId, !!(subscription || isPending))

  useHotkey('Mod+L', (e) => {
    e.preventDefault()
    toggle()
  })

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            size="icon-xs"
            aria-label="AI chat"
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
