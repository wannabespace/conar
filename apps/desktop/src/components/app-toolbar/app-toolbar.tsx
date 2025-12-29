import type { ComponentRef } from 'react'
import { Button } from '@conar/ui/components/button'
import { CtrlLetter, ShiftCtrlLetter } from '@conar/ui/components/custom/shortcuts'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import {
  RiAddLine,
  RiChat3Line,
  RiLayoutLeftLine,
  RiSettings4Line,
  RiTableLine,
} from '@remixicon/react'
import { useStore } from '@tanstack/react-store'
import { useRef } from 'react'
import { databaseStore, toggleChat, toggleResults, toggleSidebar } from '~/entities/database'
import { LayoutPopover } from './layout-popover'

interface AppToolbarProps {
  databaseId: string
  className?: string
  onNewChat?: VoidFunction
}

export function AppToolbar({ databaseId, className, onNewChat }: AppToolbarProps) {
  const store = databaseStore(databaseId)
  const { sidebarVisible, chatVisible, resultsVisible } = useStore(store, state => ({
    sidebarVisible: state.layout.sidebarVisible,
    chatVisible: state.layout.chatVisible,
    resultsVisible: state.layout.resultsVisible,
  }))
  const layoutPopoverRef = useRef<ComponentRef<typeof LayoutPopover>>(null)

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
            <CtrlLetter userAgent={navigator.userAgent} letter="N" className="text-[10px] opacity-60" />
          </span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className={cn('size-7', sidebarVisible && 'bg-accent')}
            onClick={() => toggleSidebar(databaseId)}
            aria-label="Toggle sidebar"
          >
            <RiLayoutLeftLine className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="flex items-center gap-2">
            Toggle Sidebar
            <CtrlLetter userAgent={navigator.userAgent} letter="B" className="text-[10px] opacity-60" />
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
            <CtrlLetter userAgent={navigator.userAgent} letter="J" className="text-[10px] opacity-60" />
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
            <ShiftCtrlLetter userAgent={navigator.userAgent} letter="R" className="text-[10px] opacity-60" />
          </span>
        </TooltipContent>
      </Tooltip>

      <LayoutPopover ref={layoutPopoverRef} databaseId={databaseId}>
        <Button
          size="icon-sm"
          variant="ghost"
          className="size-7"
          aria-label="Layout settings"
        >
          <RiSettings4Line className="size-4" />
        </Button>
      </LayoutPopover>
    </div>
  )
}
