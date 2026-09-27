import { SidebarLeftIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { KbdCtrlLetter } from '@tamery/ui/components/custom/shortcuts'
import { ScrollArea } from '@tamery/ui/components/scroll-area'
import { Separator } from '@tamery/ui/components/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkey } from '@tanstack/react-hotkeys'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useParams, useRouter } from '@tanstack/react-router'
import { Reorder } from 'motion/react'
import { useEffect, useEffectEvent, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'
import {
  openRunnerTab,
  removeTab,
  setActiveTab,
  updateTabs,
} from '~/entities/connection/store/helpers/tabs'
import { getConnectionResourceStore } from '~/entities/connection/store/stores'
import { parseTabId } from '~/entities/connection/store/tabs/ids'
import { tabLabels } from '~/entities/connection/store/tabs/title'

import { navigatorOpenValue } from '../navigator/constants'
import { ChatToggle } from './chat-toggle'
import { HistoryNav } from './history-nav'
import { NewTabMenu } from './new-tab-menu'
import { Tab } from './tab'
import { TabRefresh } from './tab-refresh'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const isElectron = !!window.electron

export const TabBar = ({ className }: { className?: string }) => {
  const { connection, connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const { data: tablesAndSchemas } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource })
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

  const closeTabsBeside = async (tabId: string, side: 'left' | 'right') => {
    const currentIndex = tabs.findIndex((tab) => tab.id === tabId)
    const tabsToClose =
      side === 'left'
        ? tabs.slice(0, currentIndex)
        : tabs.slice(currentIndex + 1)

    if (currentIndex === -1 || tabsToClose.length === 0) {
      return
    }

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

  useHotkey(
    'Mod+W',
    (e) => {
      e.preventDefault()

      if (activeTabId) {
        closeTab(activeTabId)
      }
    },
    { enabled: isElectron }
  )

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
      <div className="flex shrink-0 items-center gap-0.5 border-r border-b px-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                size="icon-xs"
                aria-label="Toggle sidebar"
                onClick={() => navigatorOpenValue.set((open) => !open)}
              />
            }
          >
            <HugeiconsIcon icon={SidebarLeftIcon} strokeWidth={2} />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Toggle sidebar
            <KbdCtrlLetter userAgent={navigator.userAgent} letter="B" />
          </TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="mx-0.5 h-4!" />
        <HistoryNav />
        <TabRefresh tab={activeTab} />
      </div>
      {tabs.length > 0 && (
        <ScrollArea
          className="h-full min-w-0 flex-1"
          viewportClassName="scroll-fade-x [--scroll-fade-mask:linear-gradient(to_top,#000_1px,transparent_1px),var(--scroll-fade-inline)] [-webkit-mask-composite:source-over]! [mask-composite:add]!"
        >
          <div className="flex h-8 w-max min-w-full items-stretch">
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
                  onCloseToTheLeft={() => closeTabsBeside(tab.id, 'left')}
                  onCloseToTheRight={() => closeTabsBeside(tab.id, 'right')}
                  onCloseOthers={() => closeOtherTabs(tab.id)}
                  currentTabIndex={index}
                  totalTabs={tabs.length}
                />
              ))}
            </Reorder.Group>
            <div aria-hidden className="flex-1 border-b" />
          </div>
        </ScrollArea>
      )}
      {tabs.length === 0 && (
        <div aria-hidden className="min-w-0 flex-1 border-b" />
      )}
      <div className="flex shrink-0 items-center gap-0.5 border-b border-l px-1">
        <NewTabMenu
          connection={connection}
          connectionResource={connectionResource}
          tablesAndSchemas={tablesAndSchemas}
          onNewQuery={openNewQuery}
        />
        <Separator orientation="vertical" className="mx-0.5 h-4!" />
        <ChatToggle resourceId={connectionResource.id} />
      </div>
    </div>
  )
}
