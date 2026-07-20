import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiTableLine } from '@remixicon/react'
import { getOS } from '@tamery/shared/utils/os'
import { Button } from '@tamery/ui/components/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@tamery/ui/components/context-menu'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import { ScrollArea } from '@tamery/ui/components/scroll-area'
import { SidebarTrigger } from '@tamery/ui/components/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { useIsInViewport } from '@tamery/ui/hookas/use-is-in-viewport'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useCanGoBack, useRouter, useSearch } from '@tanstack/react-router'
import { Reorder } from 'motion/react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import type { ConnectionResource } from '~/entities/connection/core'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries'
import type { connectionResourceType } from '~/entities/connection/store'
import {
  addTab,
  getConnectionResourceStore,
  removeTab,
  updateTabs,
} from '~/entities/connection/store'
import { prefetchConnectionResourceTableCore } from '~/entities/connection/utils'

import { tablePageStore } from '../../store'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const os = getOS(navigator.userAgent)

// Browser chrome already has back/forward — only the desktop app needs them
function HistoryNav() {
  const router = useRouter()
  const canGoBack = useCanGoBack()

  if (!window.electron) return null

  return (
    <>
      <span aria-hidden className="mx-0.5 h-4 w-px shrink-0 bg-border" />
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Go back"
              className="text-muted-foreground"
              disabled={!canGoBack}
              onClick={() => router.history.back()}
            />
          }
        >
          <RiArrowLeftSLine />
        </TooltipTrigger>
        <TooltipContent side="bottom">Back</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Go forward"
              className="text-muted-foreground"
              onClick={() => router.history.forward()}
            />
          }
        >
          <RiArrowRightSLine />
        </TooltipTrigger>
        <TooltipContent side="bottom">Forward</TooltipContent>
      </Tooltip>
    </>
  )
}

function getQueryOpts(connectionResource: ConnectionResource, schema: string, tableName: string) {
  const state = tablePageStore({ id: connectionResource.id, schema, table: tableName }).get()

  return {
    filters: state.filters,
    orderBy: state.orderBy,
    exact: state.exact,
  }
}

function Tab({
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
  item: { id: string; tab: (typeof connectionResourceType.infer)['tabs'][number] }
  showSchema: boolean
  connectionResource: ConnectionResource
  onClose: VoidFunction
  onCloseAll: VoidFunction
  onCloseToTheRight: VoidFunction
  onCloseOthers: VoidFunction
  currentTabIndex: number
  totalTabs: number
}) {
  const router = useRouter()
  const { schema: schemaParam, table: tableParam } = useSearch({ strict: false })
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

  const prefetch = () =>
    prefetchConnectionResourceTableCore({
      connectionResource,
      schema: item.tab.schema,
      table: item.tab.table,
      query: getQueryOpts(connectionResource, item.tab.schema, item.tab.table),
    })

  return (
    <Reorder.Item
      value={item}
      as="div"
      ref={ref}
      className={`
        relative shrink-0
        aria-pressed:z-10
      `}
    >
      <ContextMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
        <ContextMenuTrigger className="block h-full">
          <button
            data-mask
            type="button"
            aria-label={`${item.tab.schema}.${item.tab.table} tab`}
            className={cn(
              `
                group relative flex h-full cursor-default items-center gap-1.5
                border-r border-b pr-8 pl-3 text-sm whitespace-nowrap
                text-muted-foreground transition-colors duration-100
                hover:bg-background/50
              `,
              isActive &&
                `
                  border-b-transparent bg-background text-foreground
                  hover:bg-background
                `,
              item.tab.preview && 'italic',
            )}
            onDoubleClick={() => addTab(connectionResource.id, item.tab.schema, item.tab.table)}
            onMouseOver={prefetch}
            onFocus={prefetch}
            onClick={() =>
              router.navigate({
                to: '/connection/$resourceId/table',
                params: { resourceId: connectionResource.id },
                search: { schema: item.tab.schema, table: item.tab.table },
              })
            }
          >
            <RiTableLine
              className={cn(
                'size-3.5 shrink-0 text-muted-foreground/60',
                isActive && 'text-primary',
              )}
            />
            <span>
              {showSchema && <span className="text-muted-foreground">{item.tab.schema}.</span>}
              {item.tab.table}
            </span>
            <span
              role="button"
              tabIndex={-1}
              aria-label="Close tab"
              className={`
                absolute right-2 flex size-4 items-center justify-center
                rounded-sm opacity-0 transition-opacity duration-100
                group-hover:opacity-60
                hover:bg-accent hover:opacity-100!
              `}
              onClick={e => {
                e.stopPropagation()
                onClose()
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onClose()
                }
              }}
            >
              <RiCloseLine className="size-3.5" />
            </span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onClose}>
            Close
            <ContextMenuShortcut>
              <KbdCtrlLetter userAgent={navigator.userAgent} letter="W" />
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

export function TabBar({ className }: { className?: string }) {
  const { connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, { selector: state => state.showSystem })
  const { data: tablesAndSchemas } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem }),
  )
  const { schema: schemaParam, table: tableParam } = useSearch({ strict: false })
  const router = useRouter()
  const tabs = useSubscription(store, { selector: state => state.tabs })

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

    tabs.forEach(tab => {
      removeTab(connectionResource.id, tab.schema, tab.table)
    })
  }

  async function closeTabsToTheRight(schema: string, table: string) {
    const currentIndex = tabs.findIndex(tab => tab.schema === schema && tab.table === table)

    if (currentIndex === -1 || currentIndex >= tabs.length - 1) {
      return
    }

    const tabsToClose = tabs.slice(currentIndex + 1)
    const isActiveTabOnTheRight = tabsToClose.some(
      tab => tab.schema === schemaParam && tab.table === tableParam,
    )

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

    tabsToClose.forEach(tab => {
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

    const newTab =
      nextTabIndex !== null || prevTabIndex !== null ? tabs[(nextTabIndex ?? prevTabIndex)!] : null

    if (newTab) {
      await router.navigate({
        to: '/connection/$resourceId/table',
        params: { resourceId: connectionResource.id },
        search: { schema: newTab.schema, table: newTab.table },
      })
    } else {
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

  useHotkey('Mod+W', e => {
    e.preventDefault()

    if (schemaParam && tableParam) {
      closeTab(schemaParam, tableParam)
    }
  })

  const cleanupTabsEvent = useEffectEvent(async (tables: { schema: string; table: string }[]) => {
    const tabsToRemove = tabs.filter(
      tab => !tables.some(t => t.schema === tab.schema && t.table === tab.table),
    )

    for (const { schema, table } of tabsToRemove) {
      closeTab(schema, table)
    }
  })

  useEffect(() => {
    if (!tablesAndSchemas) return

    cleanupTabsEvent(
      tablesAndSchemas.schemas.flatMap(schema =>
        schema.tables.map(table => ({ schema: schema.name, table: table.name })),
      ),
    )
  }, [tablesAndSchemas])

  const isOneSchema = tabs.length
    ? tabs.every(tab => tab.schema === tabs[0]?.schema) && schemaParam === tabs[0]?.schema
    : true

  const tabItems = tabs.map(tab => ({
    id: `${tab.schema}:${tab.table}`,
    tab,
  }))

  return (
    <div className={cn('flex h-8 shrink-0 items-stretch bg-body/50', className)}>
      <div className="flex shrink-0 items-center gap-0.5 border-r border-b px-1">
        <Tooltip>
          <TooltipTrigger
            render={<SidebarTrigger className="text-muted-foreground" />}
          ></TooltipTrigger>
          <TooltipContent side="bottom">
            Toggle tables sidebar ({os.type === 'macos' ? '⌘' : 'Ctrl'} + B)
          </TooltipContent>
        </Tooltip>
        <HistoryNav />
      </div>
      {tabItems.length > 0 ? (
        <ScrollArea className="h-full min-w-0 flex-1">
          <div className="flex h-8 min-w-full items-stretch">
            <Reorder.Group
              axis="x"
              values={tabItems}
              onReorder={newItems => {
                updateTabs(
                  connectionResource.id,
                  newItems.map(item => item.tab),
                )
              }}
              className="flex items-stretch"
            >
              {tabItems.map((item, index) => (
                <Tab
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
            <div aria-hidden className="min-w-0 flex-1 border-b" />
          </div>
        </ScrollArea>
      ) : (
        <div aria-hidden className="min-w-0 flex-1 border-b" />
      )}
    </div>
  )
}
