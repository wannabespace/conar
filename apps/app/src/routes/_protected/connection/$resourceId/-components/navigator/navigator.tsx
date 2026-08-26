import { RiAddLine, RiSearchLine, RiSettings3Line } from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'
import { ResizeHandle } from '@tamery/ui/components/custom/resize-handle'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tamery/ui/components/input-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries'
import {
  getConnectionResourceStore,
  getNavigatorStore,
  openRunnerTab,
} from '~/entities/connection/store'
import { pressNavProps } from '~/lib/press-nav'

import {
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
      <div className="flex shrink-0 items-center gap-1 px-2 pb-1.5">
        <InputGroup className="bg-input/60 h-7 flex-1 rounded-md">
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
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
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
    <div className="flex shrink-0 flex-col gap-0.5 px-2 pt-1.5 pb-0.5">
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
  const [isResizing, setIsResizing] = useState(false)

  return (
    <motion.div
      initial={false}
      animate={{
        width: isOpen ? width : 0,
      }}
      transition={
        isResizing
          ? { duration: 0 }
          : {
              duration: 0.25,
              ease: [0.32, 0.72, 0, 1],
            }
      }
      className="relative h-full shrink-0 overflow-hidden"
    >
      <div
        className="text-foreground flex h-full flex-col pr-2.5"
        style={{ width }}
      >
        <div className="shrink-0 px-2 pt-0.5 pb-1.5">
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
              {navigator === 'tables' ? <TablesPanel /> : <DefinitionsPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
        <NavigatorFooter />
      </div>
      {isOpen && (
        <ResizeHandle
          aria-label="Resize sidebar"
          className="absolute inset-y-0 right-0 z-10 px-2"
          getValue={navigatorWidthValue.get}
          min={SIDEBAR_MIN_WIDTH}
          max={SIDEBAR_MAX_WIDTH}
          onResize={(value) => navigatorWidthValue.set(value)}
          onResizingChange={setIsResizing}
          onDoubleClick={() => navigatorWidthValue.set(SIDEBAR_DEFAULT_WIDTH)}
        >
          <div className="group-hover/resize-handle:bg-border group-data-resizing/resize-handle:bg-primary/40 h-full w-[2px] rounded-xs transition-colors" />
        </ResizeHandle>
      )}
    </motion.div>
  )
}
