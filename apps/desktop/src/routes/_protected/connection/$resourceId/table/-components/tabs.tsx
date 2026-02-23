import type { ComponentProps } from 'react'
import type { connectionsResources } from '~/drizzle'
import type { connectionResourceStoreType } from '~/entities/connection/store'
import { getOS, isCtrlAndKey } from '@conar/shared/utils/os'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@conar/ui/components/context-menu'
import { MotionScrollViewport, ScrollArea, ScrollBar } from '@conar/ui/components/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { useIsInViewport } from '@conar/ui/hookas/use-is-in-viewport'
import { useKeyboardEvent } from '@conar/ui/hookas/use-keyboard-event'
import { cn } from '@conar/ui/lib/utils'
import { RiCloseLine, RiTableLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearch } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { Reorder } from 'motion/react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { resourceTablesAndSchemasQuery } from '~/entities/connection/queries'
import { addTab, connectionResourceStore, removeTab, updateTabs } from '~/entities/connection/store'
import { prefetchConnectionResourceTableCore } from '~/entities/connection/utils'
import { Route } from '..'
import { tablePageStore } from '../-store'

const os = getOS(navigator.userAgent)

function CloseButton({ onClick }: { onClick: ComponentProps<'svg'>['onClick'] }) {
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

function getQueryOpts(connectionResource: typeof connectionsResources.$inferSelect, schema: string, tableName: string) {
  const store = tablePageStore({ id: connectionResource.id, schema, table: tableName })

  return {
    filters: store.state.filters,
    orderBy: store.state.orderBy,
    exact: store.state.exact,
  }
}

function SortableTab({
  item,
  connectionResource,
  showSchema,
  onClose,
  onCloseAll,
  onCloseToTheRight,
  onCloseOthers,
  currentTabIndex,
  totalTabs,
}: {
  item: { id: string, tab: typeof connectionResourceStoreType.infer['tabs'][number] }
  showSchema: boolean
  connectionResource: typeof connectionsResources.$inferSelect
  onClose: VoidFunction
  onCloseAll: VoidFunction
  onCloseToTheRight: VoidFunction
  onCloseOthers: VoidFunction
  currentTabIndex: number
  totalTabs: number
}) {
  const router = useRouter()
  const { schema: schemaParam, table: tableParam } = useSearch({ from: '/_protected/connection/$resourceId/table/' })
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIsInViewport(ref, 'full')
  const [contextMenuOpen, setContextMenuOpen] = useState(false)

  const isActive = schemaParam === item.tab.schema && tableParam === item.tab.table

  useEffect(() => {
    if (!isVisible && isActive && ref.current) {
      ref.current.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      })
    }
  }, [isActive, isVisible])

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
      <ContextMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
        <ContextMenuTrigger className="h-full">
          <button
            data-mask
            type="button"
            className={cn(
              `
                group flex h-full items-center gap-1 rounded-sm border
                border-transparent pr-1.5 pl-2 text-sm text-foreground
                hover:border-accent hover:bg-muted/70
              `,
              isActive && `
                border-primary/50 bg-primary/10
                hover:border-primary/50 hover:bg-primary/10
              `,
            )}
            onDoubleClick={() => addTab(connectionResource.id, item.tab.schema, item.tab.table, false)}
            onMouseOver={() => prefetchConnectionResourceTableCore({
              connectionResource,
              schema: item.tab.schema,
              table: item.tab.table,
              query: getQueryOpts(connectionResource, item.tab.schema, item.tab.table),
            })}
            onClick={() => router.navigate({
              to: '/connection/$resourceId/table',
              params: { resourceId: connectionResource.id },
              search: { schema: item.tab.schema, table: item.tab.table },
            })}
          >
            <RiTableLine
              className={cn(
                'size-4 shrink-0 text-muted-foreground opacity-50',
                isActive && 'text-primary opacity-100',
              )}
            />
            {showSchema && (
              <span className="text-muted-foreground">
                {item.tab.schema}
                .
              </span>
            )}
            {item.tab.table}
            <CloseButton
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
            />
          </button>
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
  className,
}: {
  className?: string
}) {
  const { connectionResource } = Route.useRouteContext()
  const store = connectionResourceStore(connectionResource.id)
  const showSystem = useStore(store, state => state.showSystem)
  const { data: tablesAndSchemas } = useQuery(resourceTablesAndSchemasQuery({ connectionResource, showSystem }))
  const { schema: schemaParam, table: tableParam } = useSearch({ from: '/_protected/connection/$resourceId/table/' })
  const router = useRouter()
  const tabs = useStore(store, state => state.tabs)

  const addNewTab = useEffectEvent((schema: string, table: string) => {
    const tab = tabs.find(tab => tab.table === table && tab.schema === schema)

    if (tab) {
      return
    }

    addTab(connectionResource.id, schema, table, true)
  })

  async function closeAllTabs() {
    if (tabs.length === 0) {
      return
    }

    if (schemaParam && tableParam) {
      await router.navigate({
        to: '/connection/$resourceId/table',
        params: { resourceId: connectionResource.id },
      })
    }

    tabs.forEach((tab) => {
      removeTab(connectionResource.id, tab.schema, tab.table)
    })
  }

  async function closeTabsToTheRight(schema: string, table: string) {
    const currentIndex = tabs.findIndex(tab => tab.schema === schema && tab.table === table)

    if (currentIndex === -1 || currentIndex >= tabs.length - 1) {
      return
    }

    const tabsToClose = tabs.slice(currentIndex + 1)
    const isActiveTabOnTheRight = tabsToClose.some(tab => tab.schema === schemaParam && tab.table === tableParam)

    if (isActiveTabOnTheRight) {
      const leftTab = tabs[currentIndex]!

      await router.navigate({
        to: '/connection/$resourceId/table',
        params: { resourceId: connectionResource.id },
        search: { schema: leftTab.schema, table: leftTab.table },
      })
    }

    for (const tab of tabsToClose) {
      removeTab(connectionResource.id, tab.schema, tab.table)
    }
  }

  async function closeOtherTabs(schema: string, table: string) {
    const tabsToClose = tabs.filter(tab => tab.schema !== schema || tab.table !== table)

    if (tabsToClose.length === 0) {
      return
    }

    const isCurrentTabActive = schemaParam === schema && tableParam === table

    if (!isCurrentTabActive) {
      await router.navigate({
        to: '/connection/$resourceId/table',
        params: { resourceId: connectionResource.id },
        search: { schema, table },
      })
    }

    tabsToClose.forEach((tab) => {
      removeTab(connectionResource.id, tab.schema, tab.table)
    })
  }

  useEffect(() => {
    if (!schemaParam || !tableParam) {
      return
    }

    addNewTab(schemaParam, tableParam)
  }, [schemaParam, tableParam])

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
        to: '/connection/$resourceId/table',
        params: { resourceId: connectionResource.id },
        search: { schema: newTab.schema, table: newTab.table },
      })
    }
    else {
      await router.navigate({
        to: '/connection/$resourceId/table',
        params: { resourceId: connectionResource.id },
      })
    }
  }

  async function closeTab(schema: string, table: string) {
    await navigateToDifferentTabIfThisActive(schema, table)
    removeTab(connectionResource.id, schema, table)
  }

  useKeyboardEvent(e => isCtrlAndKey(e, 'w'), (e) => {
    e.preventDefault()

    if (schemaParam && tableParam) {
      closeTab(schemaParam, tableParam)
    }
  })

  const cleanupTabsEvent = useEffectEvent(async (tables: { schema: string, table: string }[]) => {
    const tabsToRemove = tabs.filter(tab => !tables.some(t => t.schema === tab.schema && t.table === tab.table))

    for (const { schema, table } of tabsToRemove) {
      closeTab(schema, table)
    }
  })

  useEffect(() => {
    if (!tablesAndSchemas)
      return

    cleanupTabsEvent(tablesAndSchemas.schemas
      .flatMap(schema => schema.tables.map(table => ({ schema: schema.name, table }))))
  }, [tablesAndSchemas])

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
            updateTabs(connectionResource.id, newItems.map(item => item.tab))
          }}
          className="flex gap-1"
        >
          {tabItems.map((item, index) => (
            <SortableTab
              key={item.id}
              item={item}
              connectionResource={connectionResource}
              showSchema={!isOneSchema}
              onClose={() => closeTab(item.tab.schema, item.tab.table)}
              onCloseAll={closeAllTabs}
              onCloseToTheRight={() => closeTabsToTheRight(item.tab.schema, item.tab.table)}
              onCloseOthers={() => closeOtherTabs(item.tab.schema, item.tab.table)}
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
