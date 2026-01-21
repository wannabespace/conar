import type { ComponentProps, RefObject } from 'react'
import type { connections } from '~/drizzle'
import type { connectionStoreType } from '~/entities/connection/store'
import { getOS, isCtrlAndKey } from '@conar/shared/utils/os'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@conar/ui/components/context-menu'
import { ScrollArea, ScrollBar, ScrollViewport } from '@conar/ui/components/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useIsInViewport } from '@conar/ui/hookas/use-is-in-viewport'
import { useKeyboardEvent } from '@conar/ui/hookas/use-keyboard-event'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine, RiTableLine } from '@remixicon/react'
import { useRouter, useSearch } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { motion, Reorder } from 'motion/react'
import { useEffect, useEffectEvent, useRef } from 'react'
import { addTab, connectionStore, removeTab, updateTabs } from '~/entities/connection/store'
import { prefetchConnectionTableCore } from '~/entities/connection/utils'
import { getPageStoreState } from '../-store'

const MotionScrollViewport = motion.create(ScrollViewport)

const os = getOS(navigator.userAgent)

function CloseButton({ onClick }: { onClick: (e: React.MouseEvent<SVGSVGElement>) => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <RiCloseLine
            className={`
              size-3.5 opacity-0
              group-hover:opacity-30
              hover:opacity-100
            `}
            onClick={onClick}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={12}>
          Close tab (
          {os.type === 'macos' ? '⌘' : 'Ctrl'}
          {' '}
          + W)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function TabButton({
  className,
  children,
  active,
  onClose,
  ...props
}: ComponentProps<'button'> & {
  active: boolean
  onClose: () => void
}) {
  return (
    <button
      data-mask
      type="button"
      className={cn(
        `
          group flex h-full items-center gap-1 rounded-sm border
          border-transparent pr-1.5 pl-2 text-sm text-foreground
        `,
        'hover:border-accent hover:bg-muted/70',
        active && `
          border-primary/50 bg-primary/10
          hover:border-primary/50 hover:bg-primary/10
        `,
        className,
      )}
      {...props}
    >
      <RiTableLine
        className={cn(
          'size-4 shrink-0 text-muted-foreground opacity-50',
          active && 'text-primary opacity-100',
        )}
      />
      <span>
        {children}
      </span>
      <CloseButton
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />
    </button>
  )
}

interface SortableTabProps {
  id: string
  item: { id: string, tab: typeof connectionStoreType.infer['tabs'][number] }
  showSchema: boolean
  onClose: VoidFunction
  onCloseAll: VoidFunction
  onCloseToTheRight: VoidFunction
  onCloseOthers: VoidFunction
  onDoubleClick: VoidFunction
  onMouseOver: VoidFunction
  onFocus: (ref: RefObject<HTMLDivElement | null>) => void
  currentTabIndex: number
  totalTabs: number
}

function SortableTab({
  id,
  item,
  showSchema,
  onClose,
  onCloseAll,
  onCloseToTheRight,
  onCloseOthers,
  onDoubleClick,
  onMouseOver,
  onFocus,
  currentTabIndex,
  totalTabs,
}: SortableTabProps) {
  const router = useRouter()
  const { schema: schemaParam, table: tableParam } = useSearch({ from: '/_protected/database/$id/table/' })
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIsInViewport(ref, 'full')

  const isActive = schemaParam === item.tab.schema && tableParam === item.tab.table

  useEffect(() => {
    if (!isVisible && isActive && ref.current) {
      onFocus(ref)
    }
  }, [isActive, onFocus, isVisible])

  return (
    <Reorder.Item
      value={item}
      as="div"
      ref={ref}
      className={cn(
        `
          relative rounded-sm bg-background
          aria-pressed:z-10
        `,
        item.tab.preview && 'italic',
      )}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <TabButton
            active={schemaParam === item.tab.schema && tableParam === item.tab.table}
            onClose={onClose}
            onDoubleClick={onDoubleClick}
            onMouseOver={onMouseOver}
            onClick={() => router.navigate({
              to: '/database/$id/table',
              params: { id },
              search: { schema: item.tab.schema, table: item.tab.table },
            })}
          >
            {showSchema && (
              <span className="text-muted-foreground">
                {item.tab.schema}
                .
              </span>
            )}
            {item.tab.table}
          </TabButton>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onClose}>
            Close
            <ContextMenuShortcut>
              {os.type === 'macos' ? '⌘' : 'Ctrl'}
              + W
            </ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={onCloseOthers} disabled={totalTabs <= 1}>
            Close Others
          </ContextMenuItem>
          <ContextMenuItem onClick={onCloseToTheRight} disabled={currentTabIndex >= totalTabs - 1}>
            Close to the Right
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={onCloseAll} disabled={totalTabs === 0}>
            Close All
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Reorder.Item>
  )
}

export function TablesTabs({
  connection,
  className,
}: {
  connection: typeof connections.$inferSelect
  className?: string
}) {
  const { schema: schemaParam, table: tableParam } = useSearch({ from: '/_protected/database/$id/table/' })
  const router = useRouter()
  const store = connectionStore(connection.id)
  const tabs = useStore(store, state => state.tabs)

  const addNewTab = useEffectEvent((schema: string, table: string) => {
    const tab = tabs.find(tab => tab.table === table && tab.schema === schema)

    if (tab) {
      return
    }

    addTab(connection.id, schema, table, true)
  })

  async function closeAllTabs() {
    if (tabs.length === 0) {
      return
    }

    if (schemaParam && tableParam) {
      await router.navigate({
        to: '/database/$id/table',
        params: { id: connection.id },
      })
    }

    tabs.forEach((tab) => {
      removeTab(connection.id, tab.schema, tab.table)
    })
  }

  async function closeTabsToTheRight(currentSchema: string, currentTable: string) {
    const currentIndex = tabs.findIndex(tab => tab.schema === currentSchema && tab.table === currentTable)

    if (currentIndex === -1 || currentIndex >= tabs.length - 1) {
      return
    }

    const tabsToClose = tabs.slice(currentIndex + 1)
    const isCurrentTabActive = schemaParam === currentSchema && tableParam === currentTable

    if (isCurrentTabActive) {
      tabsToClose.forEach((tab) => {
        removeTab(connection.id, tab.schema, tab.table)
      })
    }
    else {
      tabsToClose.forEach((tab) => {
        removeTab(connection.id, tab.schema, tab.table)
      })
    }
  }

  async function closeOtherTabs(currentSchema: string, currentTable: string) {
    const tabsToClose = tabs.filter(tab => tab.schema !== currentSchema || tab.table !== currentTable)

    if (tabsToClose.length === 0) {
      return
    }

    const isCurrentTabActive = schemaParam === currentSchema && tableParam === currentTable

    if (!isCurrentTabActive) {
      await router.navigate({
        to: '/database/$id/table',
        params: { id: connection.id },
        search: { schema: currentSchema, table: currentTable },
      })
    }

    tabsToClose.forEach((tab) => {
      removeTab(connection.id, tab.schema, tab.table)
    })
  }

  useEffect(() => {
    if (!schemaParam || !tableParam) {
      return
    }

    addNewTab(schemaParam, tableParam)
  }, [schemaParam, tableParam])

  function getQueryOpts(tableName: string) {
    const state = schemaParam ? getPageStoreState(connection.id, schemaParam, tableName) : null

    if (state) {
      return {
        filters: state.filters,
        orderBy: state.orderBy,
      }
    }

    return {
      filters: [],
      orderBy: {},
    }
  }

  async function navigateToDifferentTabIfThisActive(schema: string, table: string) {
    // If this tab is not opened, do not navigate
    if (schemaParam !== schema || tableParam !== table) {
      return
    }

    const currentTabIndex = tabs.findIndex(tab => tab.schema === schema && tab.table === table)
    const nextTabIndex = currentTabIndex === tabs.length - 1 ? null : currentTabIndex + 1
    const prevTabIndex = currentTabIndex === 0 ? null : currentTabIndex - 1

    const newTab = nextTabIndex !== null || prevTabIndex !== null ? tabs[(nextTabIndex ?? prevTabIndex)!] : null

    if (newTab) {
      await router.navigate({
        to: '/database/$id/table',
        params: { id: connection.id },
        search: { schema: newTab.schema, table: newTab.table },
      })
    }
    else {
      await router.navigate({
        to: '/database/$id/table',
        params: { id: connection.id },
      })
    }
  }

  async function closeTab(schema: string, table: string) {
    await navigateToDifferentTabIfThisActive(schema, table)
    removeTab(connection.id, schema, table)
  }

  useKeyboardEvent(e => isCtrlAndKey(e, 'w'), (e) => {
    e.preventDefault()

    if (schemaParam && tableParam) {
      closeTab(schemaParam, tableParam)
    }
  })

  const isOneSchema = tabs.length
    ? tabs.every(tab => tab.schema === tabs[0]?.schema) && schemaParam === tabs[0]?.schema
    : true

  const tabItems = tabs.map(tab => ({
    id: `${tab.schema}:${tab.table}`,
    tab,
  }))

  return (
    <ScrollArea>
      <MotionScrollViewport
        layoutScroll
        className={cn('flex gap-1 p-1', className)}
      >
        <Reorder.Group
          axis="x"
          values={tabItems}
          onReorder={(newItems) => {
            updateTabs(connection.id, newItems.map(item => item.tab))
          }}
          className="flex gap-1"
        >
          {tabItems.map((item, index) => (
            <SortableTab
              key={item.id}
              id={connection.id}
              item={item}
              showSchema={!isOneSchema}
              onClose={() => closeTab(item.tab.schema, item.tab.table)}
              onCloseAll={closeAllTabs}
              onCloseToTheRight={() => closeTabsToTheRight(item.tab.schema, item.tab.table)}
              onCloseOthers={() => closeOtherTabs(item.tab.schema, item.tab.table)}
              onDoubleClick={() => addTab(connection.id, item.tab.schema, item.tab.table, false)}
              onMouseOver={() => prefetchConnectionTableCore({ connection, schema: item.tab.schema, table: item.tab.table, query: getQueryOpts(item.tab.table) })}
              onFocus={(ref) => {
                ref.current?.scrollIntoView({
                  block: 'nearest',
                  inline: 'nearest',
                })
              }}
              currentTabIndex={index}
              totalTabs={tabItems.length}
            />
          ))}
        </Reorder.Group>
      </MotionScrollViewport>
      <ScrollBar orientation="horizontal" className="h-2" />
    </ScrollArea>
  )
}
