import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiNodeTree,
  RiPlayLargeLine,
  RiShieldCheckLine,
  RiSideBarLine,
  RiTableLine,
} from '@remixicon/react'
import { enabledFilters } from '@tamery/shared/filters'
import { Button } from '@tamery/ui/components/button'
import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
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
  useParams,
  useRouter,
} from '@tanstack/react-router'
import { Reorder } from 'motion/react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import type { AppMenuNode } from '~/components/app-context-menu'
import { AppContextMenu } from '~/components/app-context-menu'
import type { Connection, ConnectionResource } from '~/entities/connection/core'
import {
  resourceColumnsQueryKey,
  resourceConstraintsQueryOptions,
  resourceEnumsQueryOptions,
  resourceFunctionsQueryOptions,
  resourceIndexesQueryOptions,
  resourcePoliciesQuery,
  resourceRowsQueryInfiniteOptions,
  resourceTableColumnsQueryOptions,
  resourceTablesAndSchemasQueryOptions,
  resourceTableTotalQueryOptions,
  resourceTriggersQueryOptions,
} from '~/entities/connection/queries'
import type {
  ConnectionTab,
  DefinitionsSection,
} from '~/entities/connection/store'
import {
  getConnectionResourceStore,
  isPreviewTab,
  openRunnerTab,
  openTab,
  openTableTab,
  parseTabId,
  tableTabId,
  removeTab,
  renameTab,
  setActiveTab,
  tabLabels,
  updateTabs,
} from '~/entities/connection/store'
import { prefetchConnectionResourceTableCore } from '~/entities/connection/utils'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { pressNavProps } from '~/lib/press-nav'
import { queryClient } from '~/main'

import { tablePageStore } from '../-tabs/table/-lib/store'
import { navigatorOpenValue } from './navigator/constants'
import { schemaGroups } from './navigator/definitions-section'

interface TablesAndSchemas {
  schemas: { name: string; tables: { name: string }[] }[]
}

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const TAB_ICONS = {
  definitions: RiShieldCheckLine,
  runner: RiPlayLargeLine,
  table: RiTableLine,
  visualizer: RiNodeTree,
}

const TabRefreshButton = ({
  label,
  refreshing,
  onRefresh,
}: {
  label: string
  refreshing: boolean
  onRefresh: () => void
}) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <RefreshButton
          variant="ghost"
          size="icon-sm"
          aria-label="Refresh"
          className="text-muted-foreground"
          iconClassName="size-3.5"
          refreshing={refreshing}
          onClick={onRefresh}
        />
      }
    />
    <TooltipContent side="bottom">
      {label}
      {window.electron && (
        <KbdCtrlLetter userAgent={navigator.userAgent} letter="R" />
      )}
    </TooltipContent>
  </Tooltip>
)

const DEFINITIONS_QUERY_OPTIONS: Record<
  DefinitionsSection,
  (params: { connectionResource: ConnectionResource }) => { queryKey: string[] }
> = {
  constraints: resourceConstraintsQueryOptions,
  enums: resourceEnumsQueryOptions,
  functions: resourceFunctionsQueryOptions,
  indexes: resourceIndexesQueryOptions,
  policies: resourcePoliciesQuery,
  triggers: resourceTriggersQueryOptions,
}

const DefinitionsRefresh = ({ section }: { section: DefinitionsSection }) => {
  const { connectionResource } = useRouteContext()
  const { queryKey } = DEFINITIONS_QUERY_OPTIONS[section]({
    connectionResource,
  })
  const isFetching = useIsFetching({ queryKey }) > 0
  const [isUserRefreshing, setIsUserRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsUserRefreshing(true)

    return queryClient
      .invalidateQueries({ queryKey })
      .finally(() => setIsUserRefreshing(false))
  }

  useRefreshHotkey(handleRefresh, isFetching)

  return (
    <TabRefreshButton
      label={`Refresh ${section}`}
      refreshing={isUserRefreshing}
      onRefresh={handleRefresh}
    />
  )
}

const VisualizerRefresh = () => {
  const { connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, {
    selector: (state) => state.showSystem,
  })
  const tablesAndSchemasKey = resourceTablesAndSchemasQueryOptions({
    connectionResource,
    showSystem,
  }).queryKey
  const columnsKey = resourceColumnsQueryKey({ connectionResource })
  const constraintsKey = resourceConstraintsQueryOptions({
    connectionResource,
  }).queryKey
  const isFetching =
    useIsFetching({ queryKey: tablesAndSchemasKey }) +
      useIsFetching({ queryKey: columnsKey }) +
      useIsFetching({ queryKey: constraintsKey }) >
    0
  const [isUserRefreshing, setIsUserRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsUserRefreshing(true)

    return Promise.all([
      queryClient.invalidateQueries({ queryKey: tablesAndSchemasKey }),
      queryClient.invalidateQueries({ queryKey: columnsKey }),
      queryClient.invalidateQueries({ queryKey: constraintsKey }),
    ]).finally(() => setIsUserRefreshing(false))
  }

  useRefreshHotkey(handleRefresh, isFetching)

  return (
    <TabRefreshButton
      label="Refresh diagram"
      refreshing={isUserRefreshing}
      onRefresh={handleRefresh}
    />
  )
}

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
  const [isUserRefreshing, setIsUserRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsUserRefreshing(true)

    return Promise.all([
      queryClient.invalidateQueries(rowsQueryOpts),
      queryClient.invalidateQueries(
        resourceTableColumnsQueryOptions({
          connectionResource,
          table,
          schema,
        })
      ),
      queryClient.invalidateQueries(
        resourceTableTotalQueryOptions({
          connectionResource,
          table,
          schema,
          query: { filters, exact },
        })
      ),
      queryClient.invalidateQueries(
        resourceConstraintsQueryOptions({ connectionResource })
      ),
      queryClient.invalidateQueries(
        resourceEnumsQueryOptions({ connectionResource })
      ),
    ]).finally(() => setIsUserRefreshing(false))
  }

  useRefreshHotkey(handleRefresh, isFetching)

  return (
    <TabRefreshButton
      label="Refresh table"
      refreshing={isUserRefreshing}
      onRefresh={handleRefresh}
    />
  )
}

const TabRefresh = ({ tab }: { tab: ConnectionTab | null }) => {
  if (tab?.type === 'table') {
    return <TableRefresh schema={tab.schema} table={tab.table} />
  }

  if (tab?.type === 'definitions') {
    return <DefinitionsRefresh section={tab.section} />
  }

  if (tab?.type === 'visualizer') {
    return <VisualizerRefresh />
  }

  return (
    <RefreshButton
      variant="ghost"
      size="icon-sm"
      aria-label="Refresh"
      className="text-muted-foreground"
      iconClassName="size-3.5"
      refreshing={false}
      disabled
    />
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

const NewTabMenu = ({
  connection,
  connectionResource,
  tablesAndSchemas,
  onNewQuery,
}: {
  connection: Connection
  connectionResource: ConnectionResource
  tablesAndSchemas: TablesAndSchemas | undefined
  onNewQuery: VoidFunction
}) => {
  const router = useRouter()
  const schemas = tablesAndSchemas?.schemas ?? []
  const showSchema = schemas.length > 1

  const goToTab = (tabId: string) =>
    router.navigate({
      to: '/connection/$resourceId/$tabId',
      params: { resourceId: connectionResource.id, tabId },
    })

  return (
    <div className="flex shrink-0 items-center border-b border-l px-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="New tab"
              className="text-muted-foreground"
            />
          }
        >
          <RiAddLine />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="max-h-[70vh] min-w-48 overflow-auto"
        >
          <DropdownMenuItem onClick={onNewQuery}>
            <RiPlayLargeLine />
            New query
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Schema</DropdownMenuLabel>
            {schemaGroups(connection)
              .flatMap((group) => group.items)
              .map(({ Icon, label, open, tabId }) => (
                <DropdownMenuItem
                  key={tabId}
                  onClick={() => {
                    open(connectionResource.id, false)
                    goToTab(tabId)
                  }}
                >
                  <Icon />
                  {label}
                </DropdownMenuItem>
              ))}
          </DropdownMenuGroup>
          {schemas.some((schema) => schema.tables.length > 0) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Tables</DropdownMenuLabel>
                {schemas.flatMap((schema) =>
                  schema.tables.map((table) => (
                    <DropdownMenuItem
                      key={tableTabId(schema.name, table.name)}
                      onClick={() => {
                        openTableTab(
                          connectionResource.id,
                          schema.name,
                          table.name
                        )
                        goToTab(tableTabId(schema.name, table.name))
                      }}
                    >
                      <RiTableLine />
                      <span data-mask className="truncate">
                        {showSchema
                          ? `${schema.name}.${table.name}`
                          : table.name}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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

const REORDER_TRANSITION = {
  duration: 0.2,
  ease: [0.32, 0.72, 0, 1],
} as const

const Tab = ({
  tab,
  label,
  defaultLabel,
  connectionResource,
  isActive,
  isDragging,
  onDragStateChange,
  onClose,
  onCloseAll,
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
      onSelect: startRename,
    },
    ...(tab.title
      ? [
          {
            label: 'Reset Name',
            onSelect: () => renameTab(connectionResource.id, tab.id, null),
          },
        ]
      : []),
    { type: 'separator' },
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
    `group text-muted-foreground hover:bg-background/50 relative flex h-full cursor-default items-center gap-1.5 border-r border-b pr-8 pl-3 text-sm font-[450] whitespace-nowrap transition-colors duration-100`,
    isActive &&
      `bg-background text-foreground hover:bg-background border-b-transparent font-medium`,
    isPreview && 'italic'
  )

  const icon = (
    <Icon
      className={cn(
        'text-muted-foreground/60 size-3.5 shrink-0',
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
  const { connection, connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, {
    selector: (state) => state.showSystem,
  })
  const { data: tablesAndSchemas } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem })
  )
  const { tabId: activeTabId } = useParams({ strict: false })
  const router = useRouter()
  const tabs = useSubscription(store, { selector: (state) => state.tabs })
  const activeTab = activeTabId ? parseTabId(activeTabId) : null

  const openNewQuery = () =>
    router.navigate({
      to: '/connection/$resourceId/$tabId',
      params: {
        resourceId: connectionResource.id,
        tabId: openRunnerTab(connectionResource.id),
      },
    })

  const goToTab = (tabId: string | null) => {
    if (!tabId) {
      setActiveTab(connectionResource.id, null)
      return router.navigate({
        to: '/connection/$resourceId',
        params: { resourceId: connectionResource.id },
      })
    }

    return router.navigate({
      to: '/connection/$resourceId/$tabId',
      params: { resourceId: connectionResource.id, tabId },
    })
  }

  const closeAllTabs = async () => {
    if (tabs.length === 0) {
      return
    }

    await goToTab(null)

    for (const tab of tabs) {
      removeTab(connectionResource.id, tab.id)
    }
  }

  const closeTabsToTheRight = async (tabId: string) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === tabId)

    if (currentIndex === -1 || currentIndex >= tabs.length - 1) {
      return
    }

    const tabsToClose = tabs.slice(currentIndex + 1)

    if (tabsToClose.some((tab) => tab.id === activeTabId)) {
      await goToTab(tabId)
    }

    for (const tab of tabsToClose) {
      removeTab(connectionResource.id, tab.id)
    }
  }

  const closeOtherTabs = async (tabId: string) => {
    const tabsToClose = tabs.filter((tab) => tab.id !== tabId)

    if (tabsToClose.length === 0) {
      return
    }

    if (activeTabId !== tabId) {
      await goToTab(tabId)
    }

    for (const tab of tabsToClose) {
      removeTab(connectionResource.id, tab.id)
    }
  }

  const closeTab = async (tabId: string) => {
    if (activeTabId === tabId) {
      const currentIndex = tabs.findIndex((tab) => tab.id === tabId)
      const nextTab = tabs[currentIndex + 1] ?? tabs[currentIndex - 1] ?? null

      await goToTab(nextTab?.id ?? null)
    }

    removeTab(connectionResource.id, tabId)
  }

  useHotkey('Mod+W', (e) => {
    e.preventDefault()

    if (activeTabId) {
      closeTab(activeTabId)
    }
  })

  useHotkey('Mod+B', (e) => {
    e.preventDefault()
    navigatorOpenValue.set((open) => !open)
  })

  const closeTabEvent = useEffectEvent(closeTab)

  useEffect(() => {
    for (const tab of tabs.filter((item) => !parseTabId(item.id))) {
      closeTabEvent(tab.id)
    }
  }, [tabs])

  const cleanupTabsEvent = useEffectEvent(
    (tables: { schema: string; table: string }[]) => {
      const tabsToRemove = tabs.filter(
        (tab) =>
          tab.type === 'table' &&
          !tables.some((t) => t.schema === tab.schema && t.table === tab.table)
      )

      for (const tab of tabsToRemove) {
        closeTab(tab.id)
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

  const labels = tabLabels(tabs)
  const tabIds = tabs.map((tab) => tab.id)
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div
      className={cn('bg-body/50 flex h-8 shrink-0 items-stretch', className)}
    >
      <div className="flex shrink-0 items-center gap-0.5 border-r border-b pr-1 pl-0.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Toggle sidebar"
                className="text-muted-foreground"
                onClick={() => navigatorOpenValue.set((open) => !open)}
              />
            }
          >
            <RiSideBarLine />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Toggle sidebar
            <KbdCtrlLetter userAgent={navigator.userAgent} letter="B" />
          </TooltipContent>
        </Tooltip>
        <HistoryNav />
        <TabRefresh tab={activeTab} />
      </div>
      {tabs.length > 0 && (
        <ScrollArea className="h-full w-fit min-w-0">
          <div className="flex h-8 items-stretch">
            <Reorder.Group
              axis="x"
              values={tabIds}
              onReorder={(newIds) =>
                updateTabs(
                  connectionResource.id,
                  newIds
                    .map((id) => tabs.find((tab) => tab.id === id))
                    .filter((tab) => !!tab)
                )
              }
              className="flex items-stretch"
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.id}
                  tab={tab}
                  label={labels[index]?.label ?? ''}
                  defaultLabel={labels[index]?.defaultLabel ?? ''}
                  isActive={tab.id === activeTabId}
                  isDragging={isDragging}
                  onDragStateChange={setIsDragging}
                  connectionResource={connectionResource}
                  onClose={() => closeTab(tab.id)}
                  onCloseAll={closeAllTabs}
                  onCloseToTheRight={() => closeTabsToTheRight(tab.id)}
                  onCloseOthers={() => closeOtherTabs(tab.id)}
                  currentTabIndex={index}
                  totalTabs={tabs.length}
                />
              ))}
            </Reorder.Group>
          </div>
        </ScrollArea>
      )}
      <div aria-hidden className="min-w-0 flex-1 border-b" />
      <NewTabMenu
        connection={connection}
        connectionResource={connectionResource}
        tablesAndSchemas={tablesAndSchemas}
        onNewQuery={openNewQuery}
      />
    </div>
  )
}
