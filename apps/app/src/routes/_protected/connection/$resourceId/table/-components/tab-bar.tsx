import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiSideBarLine,
  RiTableLine,
} from '@remixicon/react'
import { enabledFilters } from '@tamery/shared/filters'
import { Button } from '@tamery/ui/components/button'
import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import { ScrollArea } from '@tamery/ui/components/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useIsInViewport } from '@tamery/ui/hookas/use-is-in-viewport'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useIsFetching, useQuery } from '@tanstack/react-query'
import {
  getRouteApi,
  useCanGoBack,
  useRouter,
  useSearch,
} from '@tanstack/react-router'
import { Reorder } from 'motion/react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import type { AppMenuNode } from '~/components/app-context-menu'
import { AppContextMenu } from '~/components/app-context-menu'
import type { ConnectionResource } from '~/entities/connection/core'
import {
  resourceConstraintsQueryOptions,
  resourceEnumsQueryOptions,
  resourceRowsQueryInfiniteOptions,
  resourceTableColumnsQueryOptions,
  resourceTablesAndSchemasQueryOptions,
  resourceTableTotalQueryOptions,
} from '~/entities/connection/queries'
import type { connectionResourceType } from '~/entities/connection/store'
import {
  addTab,
  getConnectionResourceStore,
  removeTab,
  updateTabs,
} from '~/entities/connection/store'
import { prefetchConnectionResourceTableCore } from '~/entities/connection/utils'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { pressNavProps } from '~/lib/press-nav'
import { queryClient } from '~/main'

import { tablePageStore } from '../-lib/store'
import { tablesSidebarOpenValue } from './sidebar/constants'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const TableRefresh = ({ schema, table }: { schema: string; table: string }) => {
  const { connectionResource } = useRouteContext()
  const store = tablePageStore({ id: connectionResource.id, schema, table })
  const { filters, orderBy, exact } = useSubscription(store, {
    selector: (state) => ({
      filters: enabledFilters(state.filters),
      orderBy: state.orderBy,
      exact: state.exact,
    }),
  })

  const rowsQueryOpts = resourceRowsQueryInfiniteOptions({
    connectionResource,
    table,
    schema,
    query: { filters, orderBy },
  })
  const isFetching = useIsFetching({ queryKey: rowsQueryOpts.queryKey }) > 0

  const handleRefresh = () => {
    queryClient.invalidateQueries(rowsQueryOpts)
    queryClient.invalidateQueries(
      resourceTableColumnsQueryOptions({ connectionResource, table, schema })
    )
    queryClient.invalidateQueries(
      resourceTableTotalQueryOptions({
        connectionResource,
        table,
        schema,
        query: { filters, exact },
      })
    )
    queryClient.invalidateQueries(
      resourceConstraintsQueryOptions({ connectionResource })
    )
    queryClient.invalidateQueries(
      resourceEnumsQueryOptions({ connectionResource })
    )
  }

  useRefreshHotkey(handleRefresh, isFetching)

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <RefreshButton
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            iconClassName="size-3.5"
            refreshing={isFetching}
            onClick={handleRefresh}
          />
        }
      />
      <TooltipContent side="bottom">
        Refresh table
        {window.electron && (
          <KbdCtrlLetter userAgent={navigator.userAgent} letter="R" />
        )}
      </TooltipContent>
    </Tooltip>
  )
}

const HistoryNav = () => {
  const router = useRouter()
  const canGoBack = useCanGoBack()

  if (!window.electron) {
    return null
  }

  return (
    <>
      <span aria-hidden className="bg-border mx-0.5 h-4 w-px shrink-0" />
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
    exact: state.exact,
  }
}

const Tab = ({
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
  item: {
    id: string
    tab: (typeof connectionResourceType.infer)['tabs'][number]
  }
  showSchema: boolean
  connectionResource: ConnectionResource
  onClose: VoidFunction
  onCloseAll: VoidFunction
  onCloseToTheRight: VoidFunction
  onCloseOthers: VoidFunction
  currentTabIndex: number
  totalTabs: number
}) => {
  const router = useRouter()
  const { schema: schemaParam, table: tableParam } = useSearch({
    strict: false,
  })
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIsInViewport(ref, 'full')
  const [contextMenuOpen, setContextMenuOpen] = useState(false)

  const isActive =
    schemaParam === item.tab.schema && tableParam === item.tab.table

  const items: AppMenuNode[] = [
    {
      label: 'Close',
      accelerator: 'CmdOrCtrl+W',
      shortcut: <KbdCtrlLetter userAgent={navigator.userAgent} letter="W" />,
      onSelect: onClose,
    },
    { type: 'separator' },
    {
      label: 'Close Others',
      disabled: totalTabs <= 1,
      onSelect: onCloseOthers,
    },
    {
      label: 'Close to the Right',
      disabled: currentTabIndex >= totalTabs - 1,
      onSelect: onCloseToTheRight,
    },
    { type: 'separator' },
    { label: 'Close All', disabled: totalTabs === 0, onSelect: onCloseAll },
  ]

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

  const goToTab = () =>
    router.navigate({
      to: '/connection/$resourceId/table',
      params: { resourceId: connectionResource.id },
      search: { schema: item.tab.schema, table: item.tab.table },
    })

  return (
    <Reorder.Item
      value={item}
      as="div"
      ref={ref}
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
          aria-label={`${item.tab.schema}.${item.tab.table} tab`}
          className={cn(
            `group text-muted-foreground hover:bg-background/50 relative flex h-full cursor-default items-center gap-1.5 border-r border-b pr-8 pl-3 text-sm whitespace-nowrap transition-colors duration-100`,
            isActive &&
              `bg-background text-foreground hover:bg-background border-b-transparent`,
            item.tab.preview && 'italic'
          )}
          onDoubleClick={() =>
            addTab(connectionResource.id, item.tab.schema, item.tab.table)
          }
          onMouseOver={prefetch}
          onFocus={prefetch}
          {...pressNavProps(goToTab)}
        >
          <RiTableLine
            className={cn(
              'text-muted-foreground/60 size-3.5 shrink-0',
              isActive && 'text-primary'
            )}
          />
          <span>
            {showSchema && (
              <span className="text-muted-foreground">{item.tab.schema}.</span>
            )}
            {item.tab.table}
          </span>
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
              <RiCloseLine className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Close tab</TooltipContent>
          </Tooltip>
        </button>
      </AppContextMenu>
    </Reorder.Item>
  )
}

export const TabBar = ({ className }: { className?: string }) => {
  const { connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, {
    selector: (state) => state.showSystem,
  })
  const { data: tablesAndSchemas } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem })
  )
  const { schema: schemaParam, table: tableParam } = useSearch({
    strict: false,
  })
  const router = useRouter()
  const tabs = useSubscription(store, { selector: (state) => state.tabs })

  const addNewTab = useEffectEvent((schema: string, table: string) => {
    const existingTab = tabs.find(
      (item) => item.table === table && item.schema === schema
    )

    if (existingTab) {
      return
    }

    addTab(connectionResource.id, schema, table, true)
  })

  const closeAllTabs = async () => {
    if (tabs.length === 0) {
      return
    }

    if (schemaParam && tableParam) {
      await router.navigate({
        to: '/connection/$resourceId/table',
        params: { resourceId: connectionResource.id },
      })
    }

    for (const item of tabs) {
      removeTab(connectionResource.id, item.schema, item.table)
    }
  }

  const closeTabsToTheRight = async (schema: string, table: string) => {
    const currentIndex = tabs.findIndex(
      (item) => item.schema === schema && item.table === table
    )

    if (currentIndex === -1 || currentIndex >= tabs.length - 1) {
      return
    }

    const tabsToClose = tabs.slice(currentIndex + 1)
    const isActiveTabOnTheRight = tabsToClose.some(
      (item) => item.schema === schemaParam && item.table === tableParam
    )

    if (isActiveTabOnTheRight) {
      const leftTab = tabs[currentIndex]
      if (!leftTab) {
        return
      }

      await router.navigate({
        to: '/connection/$resourceId/table',
        params: { resourceId: connectionResource.id },
        search: { schema: leftTab.schema, table: leftTab.table },
      })
    }

    for (const item of tabsToClose) {
      removeTab(connectionResource.id, item.schema, item.table)
    }
  }

  const closeOtherTabs = async (schema: string, table: string) => {
    const tabsToClose = tabs.filter(
      (item) => item.schema !== schema || item.table !== table
    )

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

    for (const item of tabsToClose) {
      removeTab(connectionResource.id, item.schema, item.table)
    }
  }

  useEffect(() => {
    if (!schemaParam || !tableParam) {
      return
    }

    addNewTab(schemaParam, tableParam)
  }, [schemaParam, tableParam])

  const navigateToDifferentTabIfThisActive = async (
    schema: string,
    table: string
  ) => {
    if (schemaParam !== schema || tableParam !== table) {
      return
    }

    const currentTabIndex = tabs.findIndex(
      (item) => item.schema === schema && item.table === table
    )
    const nextTabIndex =
      currentTabIndex === tabs.length - 1 ? null : currentTabIndex + 1
    const prevTabIndex = currentTabIndex === 0 ? null : currentTabIndex - 1
    const fallbackIndex = nextTabIndex ?? prevTabIndex
    const newTab = fallbackIndex === null ? null : (tabs[fallbackIndex] ?? null)

    await router.navigate(
      newTab
        ? {
            to: '/connection/$resourceId/table',
            params: { resourceId: connectionResource.id },
            search: { schema: newTab.schema, table: newTab.table },
          }
        : {
            to: '/connection/$resourceId/table',
            params: { resourceId: connectionResource.id },
          }
    )
  }

  const closeTab = async (schema: string, table: string) => {
    await navigateToDifferentTabIfThisActive(schema, table)
    removeTab(connectionResource.id, schema, table)
  }

  useHotkey('Mod+W', (e) => {
    e.preventDefault()

    if (schemaParam && tableParam) {
      closeTab(schemaParam, tableParam)
    }
  })

  useHotkey('Mod+B', (e) => {
    e.preventDefault()
    tablesSidebarOpenValue.set((open) => !open)
  })

  const cleanupTabsEvent = useEffectEvent(
    (tables: { schema: string; table: string }[]) => {
      const tabsToRemove = tabs.filter(
        (tab) =>
          !tables.some((t) => t.schema === tab.schema && t.table === tab.table)
      )

      for (const { schema, table } of tabsToRemove) {
        closeTab(schema, table)
      }
    }
  )

  useEffect(() => {
    if (!tablesAndSchemas) {
      return
    }

    cleanupTabsEvent(
      tablesAndSchemas.schemas.flatMap((schema) =>
        schema.tables.map((table) => ({
          schema: schema.name,
          table: table.name,
        }))
      )
    )
  }, [tablesAndSchemas])

  const isOneSchema = tabs.length
    ? tabs.every((tab) => tab.schema === tabs[0]?.schema) &&
      schemaParam === tabs[0]?.schema
    : true

  const tabItems = tabs.map((tab) => ({
    id: `${tab.schema}:${tab.table}`,
    tab,
  }))

  return (
    <div
      className={cn('bg-body/50 flex h-8 shrink-0 items-stretch', className)}
    >
      <div className="flex shrink-0 items-center gap-0.5 border-r border-b px-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Toggle tables sidebar"
                className="text-muted-foreground"
                onClick={() => tablesSidebarOpenValue.set((open) => !open)}
              />
            }
          >
            <RiSideBarLine />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Toggle tables sidebar
            <KbdCtrlLetter userAgent={navigator.userAgent} letter="B" />
          </TooltipContent>
        </Tooltip>
        <HistoryNav />
        {schemaParam && tableParam && (
          <TableRefresh schema={schemaParam} table={tableParam} />
        )}
      </div>
      {tabItems.length > 0 ? (
        <ScrollArea className="h-full min-w-0 flex-1">
          <div className="flex h-8 min-w-full items-stretch">
            <Reorder.Group
              axis="x"
              values={tabItems}
              onReorder={(newItems) => {
                updateTabs(
                  connectionResource.id,
                  newItems.map((item) => item.tab)
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
                  onCloseToTheRight={() =>
                    closeTabsToTheRight(item.tab.schema, item.tab.table)
                  }
                  onCloseOthers={() =>
                    closeOtherTabs(item.tab.schema, item.tab.table)
                  }
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
