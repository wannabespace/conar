import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CancelSquareIcon,
  HierarchyIcon,
  LayoutTable02Icon,
  PencilEdit01Icon,
  PlayIcon,
  SecurityCheckIcon,
  Undo02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useIsInViewport } from '@tamery/ui/hookas/use-is-in-viewport'
import { cn } from '@tamery/ui/lib/utils'
import { useRouter } from '@tanstack/react-router'
import { Reorder } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { AppContextMenu } from '~/components/app-context-menu'
import type { AppMenuNode } from '~/components/app-menu'
import type { ConnectionResource } from '~/entities/connection/core/sync'
import { prefetchConnectionResourceTableCore } from '~/entities/connection/fetching'
import { openTab, renameTab } from '~/entities/connection/store/helpers/tabs'
import type { ConnectionTab } from '~/entities/connection/store/tabs/types'
import { isPreviewTab } from '~/entities/connection/store/tabs/types'
import { pressNavProps } from '~/lib/press-nav'

import { tablePageStore } from '../../-tabs/table/-lib/store'

const TAB_ICONS = {
  definitions: SecurityCheckIcon,
  runner: PlayIcon,
  table: LayoutTable02Icon,
  visualizer: HierarchyIcon,
}

const getQueryOpts = (
  connectionResource: ConnectionResource,
  schema: string,
  tableName: string
) => {
  const state = tablePageStore({
    id: connectionResource.id,
    schema,
    table: tableName,
  }).get()

  return {
    filters: state.filters,
    orderBy: state.orderBy,
    exact: false,
  }
}

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
  const isVisible = useIsInViewport(ref, 'full')
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const Icon = TAB_ICONS[tab.type]
  const isPreview = isPreviewTab(tab)
  const isRenaming = draft !== null

  const startRename = () => {
    if (isPreviewTab(tab)) {
      openTab(connectionResource.id, { ...tab, preview: false })
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

  const items: AppMenuNode[] = [
    {
      label: 'Rename',
      icon: PencilEdit01Icon,
      onSelect: startRename,
    },
    ...(tab.title
      ? [
          {
            label: 'Reset Name',
            icon: Undo02Icon,
            onSelect: () => renameTab(connectionResource.id, tab.id, null),
          },
        ]
      : []),
    { type: 'separator' },
    {
      label: 'Close',
      icon: Cancel01Icon,
      ...(isElectron && {
        accelerator: 'CmdOrCtrl+W',
        shortcut: <KbdCtrlLetter userAgent={navigator.userAgent} letter="W" />,
      }),
      onSelect: onClose,
    },
    { type: 'separator' },
    {
      label: 'Close Others',
      icon: CancelSquareIcon,
      disabled: totalTabs <= 1,
      onSelect: onCloseOthers,
    },
    {
      label: 'Close to the Left',
      icon: ArrowLeft02Icon,
      disabled: currentTabIndex === 0,
      onSelect: onCloseToTheLeft,
    },
    {
      label: 'Close to the Right',
      icon: ArrowRight02Icon,
      disabled: currentTabIndex >= totalTabs - 1,
      onSelect: onCloseToTheRight,
    },
    { type: 'separator' },
    {
      label: 'Close All',
      icon: CancelCircleIcon,
      disabled: totalTabs === 0,
      onSelect: onCloseAll,
    },
  ]

  useEffect(() => {
    if (!isVisible && isActive && ref.current) {
      ref.current.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [isActive, isVisible])

  const prefetch = () => {
    if (tab.type === 'table') {
      prefetchConnectionResourceTableCore({
        connectionResource,
        schema: tab.schema,
        table: tab.table,
        query: getQueryOpts(connectionResource, tab.schema, tab.table),
      })
    }
  }

  const goToTab = () =>
    router.navigate({
      to: '/connection/$resourceId/$tabId',
      params: { resourceId: connectionResource.id, tabId: tab.id },
    })

  const tabClasses = cn(
    `group text-muted-foreground hover:bg-background/50 relative flex h-full cursor-default items-center gap-1.5 border-r border-b pr-8 pl-3 text-sm font-[450] whitespace-nowrap transition-colors duration-40`,
    isActive &&
      `bg-background text-foreground hover:bg-background border-b-transparent`,
    isPreview && 'italic'
  )

  const icon = (
    <HugeiconsIcon
      icon={Icon}
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
          {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- rename starts on an explicit user gesture */}
          <input
            autoFocus
            aria-label="Tab name"
            value={draft ?? ''}
            className="field-sizing-content min-w-4 border-none bg-transparent p-0 outline-hidden"
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitRename()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setDraft(null)
              }
            }}
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
      >
        <button
          data-mask
          type="button"
          aria-label={`${label} tab`}
          className={tabClasses}
          onDoubleClick={startRename}
          onMouseOver={prefetch}
          onFocus={prefetch}
          {...pressNavProps(goToTab)}
        >
          {icon}
          <span>{label}</span>
          <Tooltip>
            <TooltipTrigger
              render={
                // Nested button is invalid HTML (parent tab is already a button).
                // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
                <span
                  tabIndex={-1}
                  aria-label="Close tab"
                  className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground absolute right-2 flex size-4 items-center justify-center rounded-sm opacity-0 transition-opacity duration-100 group-hover:opacity-60 hover:opacity-100!"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      onClose()
                    }
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
