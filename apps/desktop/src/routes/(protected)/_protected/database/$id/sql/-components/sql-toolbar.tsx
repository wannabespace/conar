import type { ComponentRef } from 'react'
import { Button } from '@conar/ui/components/button'
import { CtrlLetter, ShiftCtrlLetter } from '@conar/ui/components/custom/shortcuts'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import {
  RiAddLine,
  RiChat3Line,
  RiSettings4Line,
  RiTableLine,
} from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useRef } from 'react'
import { databaseStore, toggleChat, toggleResults } from '~/entities/database'
import { SqlToolbarPopover } from './sql-toolbar-popover'

export function SqlToolbar({ databaseId, className, onNewChat }: {
  databaseId: string
  className?: string
  onNewChat?: () => void
}) {
  const store = databaseStore(databaseId)
  const { chatVisible, resultsVisible } = useStore(store, state => ({
    chatVisible: state.layout.chatVisible,
    resultsVisible: state.layout.resultsVisible,
  }))
  const layoutPopoverRef = useRef<ComponentRef<typeof SqlToolbarPopover>>(null)

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className="size-7"
            onClick={onNewChat}
            aria-label="New chat"
          >
            <RiAddLine className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="flex items-center gap-2">
            New Chat
            <CtrlLetter
              userAgent={navigator.userAgent}
              letter="N"
              className="text-[10px] opacity-60"
            />
          </span>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className={cn('size-7', chatVisible && 'bg-accent')}
            onClick={() => toggleChat(databaseId)}
            aria-label="Toggle chat panel"
          >
            <RiChat3Line className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="flex items-center gap-2">
            Toggle Chat
            <CtrlLetter
              userAgent={navigator.userAgent}
              letter="J"
              className="text-[10px] opacity-60"
            />
          </span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className={cn('size-7', resultsVisible && 'bg-accent')}
            onClick={() => toggleResults(databaseId)}
            aria-label="Toggle results panel"
          >
            <RiTableLine className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="flex items-center gap-2">
            Toggle Results
            <ShiftCtrlLetter
              userAgent={navigator.userAgent}
              letter="R"
              className="text-[10px] opacity-60"
            />
          </span>
        </TooltipContent>
      </Tooltip>

      <SqlToolbarPopover ref={layoutPopoverRef} databaseId={databaseId}>
        <Button
          size="icon-sm"
          variant="ghost"
          className="size-7"
          aria-label="Layout settings"
        >
          <RiSettings4Line className="size-4" />
        </Button>
      </SqlToolbarPopover>
    </div>
  )
}
