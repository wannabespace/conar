import type { ComponentRef } from 'react'
import { getOS } from '@conar/shared/utils/os'
import { Button } from '@conar/ui/components/button'
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
import { layoutStore, toggleChat, toggleResults, toggleSidebar } from '~/lib/layout-store'
import { LayoutPopover } from './layout-popover'

const os = getOS(navigator.userAgent)
const modKey = os.type === 'macos' ? '⌘' : 'Ctrl'

interface AppToolbarProps {
  className?: string
  onNewChat?: VoidFunction
}

export function AppToolbar({ className, onNewChat }: AppToolbarProps) {
  const { sidebarVisible, chatVisible, resultsVisible } = useStore(layoutStore, ({ sidebarVisible, chatVisible, resultsVisible }) => ({ sidebarVisible, chatVisible, resultsVisible }))
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
            <kbd className="text-[10px] opacity-60">
              {modKey}
              N
            </kbd>
          </span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className={cn('size-7', sidebarVisible && 'bg-accent')}
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <RiLayoutLeftLine className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="flex items-center gap-2">
            Toggle Sidebar
            <kbd className="text-[10px] opacity-60">
              {modKey}
              B
            </kbd>
          </span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className={cn('size-7', chatVisible && 'bg-accent')}
            onClick={toggleChat}
            aria-label="Toggle chat panel"
          >
            <RiChat3Line className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="flex items-center gap-2">
            Toggle Chat
            <kbd className="text-[10px] opacity-60">
              {modKey}
              ⇧C
            </kbd>
          </span>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className={cn('size-7', resultsVisible && 'bg-accent')}
            onClick={toggleResults}
            aria-label="Toggle results panel"
          >
            <RiTableLine className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span className="flex items-center gap-2">
            Toggle Results
            <kbd className="text-[10px] opacity-60">
              {modKey}
              ⇧R
            </kbd>
          </span>
        </TooltipContent>
      </Tooltip>

      <LayoutPopover ref={layoutPopoverRef}>
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
