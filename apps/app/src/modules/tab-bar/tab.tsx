import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CancelSquareIcon,
  PencilEdit01Icon,
  Undo02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { useRouter } from '@tanstack/react-router'
import { Reorder } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { AppContextMenu } from '~/components/app-context-menu'
import type { AppMenuNode } from '~/components/app-menu'
import type { ConnectionResource } from '~/core/connection/sync'
import { openTab, renameTab } from '~/core/tabs/actions'
import { resolveTab } from '~/core/tabs/kinds'
import type { ConnectionTab } from '~/core/tabs/types'
import { tabViews } from '~/core/tabs/views'
import { pressNavProps } from '~/utils/press-nav'

const isElectron = !!window.electron

const REORDER_TRANSITION = {
  duration: 0.2,
  ease: [0.32, 0.72, 0, 1],
} as const

export const Tab = ({
  tab,
  label,
  defaultLabel,
  connectionResource,
  isActive,
  isTabStop,
  isDragging,
  onDragStateChange,
  onClose,
  onCloseAll,
  onCloseToTheLeft,
  onCloseToTheRight,
  onCloseOthers,
  currentTabIndex,
  totalTabs,
}: {
  tab: ConnectionTab
  label: string
  defaultLabel: string
  isActive: boolean
  isTabStop: boolean
  isDragging: boolean
  onDragStateChange: (dragging: boolean) => void
  connectionResource: ConnectionResource
  onClose: VoidFunction
  onCloseAll: VoidFunction
  onCloseToTheLeft: VoidFunction
  onCloseToTheRight: VoidFunction
  onCloseOthers: VoidFunction
  currentTabIndex: number
  totalTabs: number
}) => {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const renameRef = useRef<HTMLInputElement>(null)
  const resolved = resolveTab(tab.id)
  const isPreview = !!tab.preview
  const isRenaming = draft !== null

  const startRename = () => {
    if (isPreview) {
      openTab(connectionResource.id, tab.id)
    }
    setDraft(label)
  }

  const commitRename = () => {
    if (draft === null) {
      return
    }

    const next = draft.trim()

    renameTab(
      connectionResource.id,
      tab.id,
      next && next !== defaultLabel ? next : null
    )
    setDraft(null)
  }

  const focusTab = () => ref.current?.querySelector('button')?.focus()

  const finishRename = (finish: () => void) => {
    flushSync(finish)
    focusTab()
  }

  useHotkeys(
    [
      {
        callback: (event) => {
          if (!event.isComposing) {
            finishRename(commitRename)
          }
        },
        hotkey: 'Enter',
      },
      {
        callback: () => finishRename(() => setDraft(null)),
        hotkey: 'Escape',
      },
    ],
    { target: renameRef }
  )

  const items: AppMenuNode[] = [
    {
      icon: PencilEdit01Icon,
      label: 'Rename',
      onSelect: startRename,
    },
    ...(tab.title
      ? [
          {
            icon: Undo02Icon,
            label: 'Reset Name',
            onSelect: () => renameTab(connectionResource.id, tab.id, null),
          },
        ]
      : []),
    { type: 'separator' },
    {
      icon: Cancel01Icon,
      label: 'Close',
      ...(isElectron && {
        accelerator: 'CmdOrCtrl+W',
        shortcut: <KbdCtrlLetter userAgent={navigator.userAgent} letter="W" />,
      }),
      onSelect: onClose,
    },
    { type: 'separator' },
    {
      disabled: totalTabs <= 1,
      icon: CancelSquareIcon,
      label: 'Close Others',
      onSelect: onCloseOthers,
    },
    {
      disabled: currentTabIndex === 0,
      icon: ArrowLeft02Icon,
      label: 'Close to the Left',
      onSelect: onCloseToTheLeft,
    },
    {
      disabled: currentTabIndex >= totalTabs - 1,
      icon: ArrowRight02Icon,
      label: 'Close to the Right',
      onSelect: onCloseToTheRight,
    },
    { type: 'separator' },
    {
      disabled: totalTabs === 0,
      icon: CancelCircleIcon,
      label: 'Close All',
      onSelect: onCloseAll,
    },
  ]

  useEffect(() => {
    const reveal = async () => {
      // The label font swaps in after mount and widens every tab, so a reveal before it lands leaves this tab clipped.
      await document.fonts.ready
      ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
    if (isActive) {
      reveal()
    }
  }, [isActive])

  const prefetch = () => {
    if (resolved) {
      tabViews[resolved.kind.type]?.prefetch?.(
        connectionResource,
        resolved.params
      )
    }
  }

  const goToTab = () =>
    router.navigate({
      params: { resourceId: connectionResource.id, tabId: tab.id },
      to: '/connection/$resourceId/$tabId',
    })

  const tabClasses = cn(
    `group text-muted-foreground hover:bg-background/50 font-row relative flex h-full cursor-default items-center gap-1.5 border-r border-b pr-8 pl-3 text-sm whitespace-nowrap transition-colors duration-40`,
    isActive &&
      `bg-background text-foreground hover:bg-background border-b-transparent`,
    isPreview && 'italic'
  )

  const icon = resolved && (
    <HugeiconsIcon
      icon={resolved.kind.icon}
      strokeWidth={2}
      className={cn(
        'text-muted-foreground/60 size-3.5 shrink-0 transition-colors duration-40',
        isActive && 'text-primary'
      )}
    />
  )

  if (isRenaming) {
    return (
      <Reorder.Item
        value={tab.id}
        as="div"
        ref={ref}
        drag={false}
        layout="position"
        transition={{ layout: { duration: 0 } }}
        className="relative shrink-0"
      >
        <div data-mask className={tabClasses}>
          {icon}
          <input
            ref={renameRef}
            autoFocus
            aria-label="Tab name"
            value={draft ?? ''}
            className="field-sizing-content min-w-4 border-none bg-transparent p-0 outline-hidden"
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commitRename}
          />
        </div>
      </Reorder.Item>
    )
  }

  return (
    <Reorder.Item
      value={tab.id}
      as="div"
      ref={ref}
      layout="position"
      transition={{ layout: isDragging ? REORDER_TRANSITION : { duration: 0 } }}
      onDragStart={() => onDragStateChange(true)}
      onDragEnd={() => onDragStateChange(false)}
      className="relative shrink-0 aria-pressed:z-10"
    >
      <AppContextMenu
        open={contextMenuOpen}
        onOpenChange={setContextMenuOpen}
        className="block h-full"
        items={items}
        contentProps={{
          // Rename unmounts this menu's trigger; base-ui's fallback return target would steal focus from the rename field.
          finalFocus: focusTab,
        }}
      >
        <button
          data-mask
          type="button"
          role="tab"
          aria-selected={isActive}
          tabIndex={isTabStop ? 0 : -1}
          aria-label={`${label} tab`}
          className={tabClasses}
          onDoubleClick={startRename}
          onMouseOver={prefetch}
          onFocus={(event) => {
            prefetch()
            event.currentTarget.scrollIntoView({
              block: 'nearest',
              inline: 'nearest',
            })
          }}
          {...pressNavProps(goToTab)}
        >
          {icon}
          <span>{label}</span>
          <Tooltip
            shortcut={
              isActive &&
              isElectron && (
                <KbdCtrlLetter userAgent={navigator.userAgent} letter="W" />
              )
            }
          >
            <TooltipTrigger
              render={
                // Nested button is invalid HTML (parent tab is already a button); the keyboard closes a tab from its ⌘. menu.
                // oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                <span
                  tabIndex={-1}
                  aria-label="Close tab"
                  className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground absolute right-2 flex size-4 items-center justify-center rounded-sm opacity-0 transition-opacity duration-100 group-hover:opacity-60 hover:opacity-100! data-popup-open:opacity-100"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                />
              }
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                strokeWidth={2}
                className="size-3.5"
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">Close tab</TooltipContent>
          </Tooltip>
        </button>
      </AppContextMenu>
    </Reorder.Item>
  )
}
