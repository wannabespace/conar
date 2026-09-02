import { RiAddLine, RiSearchLine, RiSettings3Line } from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tamery/ui/components/input-group'
import {
  ResizableHandle,
  ResizablePanel,
} from '@tamery/ui/components/resizable'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { usePanelRef } from 'react-resizable-panels'
import { useSubscription } from 'seitu/react'

import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries'
import {
  getConnectionResourceStore,
  getNavigatorStore,
  openRunnerTab,
} from '~/entities/connection/store'
import { pressNavProps } from '~/lib/press-nav'

import {
  NAVIGATOR_PANEL_ID,
  navigatorOpenValue,
  navigatorWidthValue,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from './constants'
import { DefinitionsPanel } from './definitions-section'
import { NavigatorSwitcher } from './navigator-switcher'
import { TablesList } from './tables-list'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const TablesPanel = () => {
  const { connectionResource } = useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, {
    selector: (state) => state.showSystem,
  })
  const search = useSubscription(store, {
    selector: (state) => state.tablesSearch,
  })
  const {
    refetch: refetchTablesAndSchemas,
    isFetching: isRefreshingTablesAndSchemas,
    dataUpdatedAt,
  } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem })
  )

  return (
    <>
      <div className="flex shrink-0 items-center gap-1 pb-1.5 pl-2">
        <InputGroup className="h-7 flex-1 rounded-md">
          <InputGroupAddon>
            <RiSearchLine className="text-muted-foreground/70 size-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search"
            className="text-sm"
            value={search}
            onChange={(e) =>
              store.set(
                (state) =>
                  ({
                    ...state,
                    tablesSearch: e.target.value,
                  }) satisfies typeof state
              )
            }
          />
        </InputGroup>
        <Tooltip>
          <TooltipTrigger
            render={
              <RefreshButton
                variant="outline"
                size="icon-sm"
                className="text-muted-foreground rounded-md"
                onClick={() => refetchTablesAndSchemas()}
                refreshing={isRefreshingTablesAndSchemas}
              />
            }
          />
          <TooltipContent side="bottom">
            <div className="flex flex-col gap-0.5">
              <span>Refresh tables and schemas</span>
              <span className="opacity-70">
                Last updated:{' '}
                {dataUpdatedAt
                  ? new Date(dataUpdatedAt).toLocaleTimeString()
                  : 'never'}
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      <TablesList className="min-h-0 flex-1" search={search} />
    </>
  )
}

const NavigatorFooter = () => {
  const { connectionResource } = useRouteContext()
  const router = useRouter()

  const openNewQuery = () =>
    router.navigate({
      to: '/connection/$resourceId/$tabId',
      params: {
        resourceId: connectionResource.id,
        tabId: openRunnerTab(connectionResource.id),
      },
    })

  return (
    <div className="flex shrink-0 flex-col gap-0.5 pt-1.5 pb-0.5 pl-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-foreground hover:bg-accent h-7 w-full justify-start gap-2 rounded-md px-2 font-[450]"
        {...pressNavProps(openNewQuery)}
      >
        <RiAddLine className="text-muted-foreground size-4 shrink-0" />
        New query
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="text-foreground h-7 w-full justify-start gap-2 rounded-md px-2 font-[450]"
      >
        <RiSettings3Line className="text-muted-foreground size-4 shrink-0" />
        Settings
      </Button>
    </div>
  )
}

export const Navigator = () => {
  const { connectionResource } = useRouteContext()
  const isOpen = useSubscription(navigatorOpenValue)
  const width = useSubscription(navigatorWidthValue)
  const navigator = useSubscription(getNavigatorStore(connectionResource.id))
  const panelRef = usePanelRef()

  return (
    <>
      <ResizablePanel
        id={NAVIGATOR_PANEL_ID}
        panelRef={panelRef}
        collapsed={!isOpen}
        defaultSize={width}
        minSize={SIDEBAR_MIN_WIDTH}
        maxSize={SIDEBAR_MAX_WIDTH}
        groupResizeBehavior="preserve-pixel-size"
        style={{ overflow: 'hidden' }}
        onResize={({ inPixels }) => {
          if (inPixels > 0) {
            navigatorWidthValue.set(inPixels)
          }
        }}
      >
        <div
          className="text-foreground flex h-full flex-col pr-1.5"
          style={{ width }}
        >
          <div className="shrink-0 pt-0.5 pb-1.5 pl-2">
            <NavigatorSwitcher />
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={navigator}
                initial={{ opacity: 0, x: navigator === 'tables' ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: navigator === 'tables' ? 12 : -12 }}
                transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                className="flex min-h-0 flex-1 flex-col"
              >
                {navigator === 'tables' ? (
                  <TablesPanel />
                ) : (
                  <DefinitionsPanel />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <NavigatorFooter />
        </div>
      </ResizablePanel>
      <ResizableHandle
        aria-label="Resize sidebar"
        className="-ml-1.5"
        disabled={!isOpen}
        disableDoubleClick
        onDoubleClick={() => panelRef.current?.resize(SIDEBAR_DEFAULT_WIDTH)}
      />
    </>
  )
}
