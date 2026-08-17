import { RiSearchLine } from '@remixicon/react'
import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'
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
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries'
import {
  getConnectionResourceStore,
  getNavigatorStore,
} from '~/entities/connection/store'

import {
  navigatorOpenValue,
  navigatorWidthValue,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from './constants'
import { DefinitionsPanel } from './definitions-section'
import { NavigatorMenu } from './navigator-menu'
import { NavigatorSwitcher } from './navigator-switcher'
import { TablesList } from './tables-list'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const resizeOverlay = document.createElement('div')
resizeOverlay.className =
  'cursor-col-resize size-full fixed top-0 left-0 z-1000'

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
        <NavigatorMenu />
      </div>
      <TablesList className="min-h-0 flex-1" search={search} />
    </>
  )
}

export const Navigator = () => {
  const { connectionResource } = useRouteContext()
  const isOpen = useSubscription(navigatorOpenValue)
  const width = useSubscription(navigatorWidthValue)
  const navigator = useSubscription(getNavigatorStore(connectionResource.id))
  const [isResizing, setIsResizing] = useState(false)

  const handleResize = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsResizing(true)
    const startX = e.clientX
    const startWidth = navigatorWidthValue.get()

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeOverlay.parentElement) {
        document.body.append(resizeOverlay)
      }
      navigatorWidthValue.set(
        Math.min(
          SIDEBAR_MAX_WIDTH,
          Math.max(SIDEBAR_MIN_WIDTH, startWidth + moveEvent.clientX - startX)
        )
      )
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      setIsResizing(false)
      if (resizeOverlay.parentElement) {
        resizeOverlay.remove()
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

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
      </div>
      {isOpen && (
        <div
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- interactive resize handle
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          tabIndex={0}
          className="group absolute inset-y-0 right-0 z-10 cursor-col-resize px-2 duration-150 select-none"
          onMouseDown={handleResize}
          onDoubleClick={() => navigatorWidthValue.set(SIDEBAR_DEFAULT_WIDTH)}
        >
          <div
            className={cn(
              'group-hover:bg-border h-full w-px rounded-xs transition-colors',
              isResizing && 'bg-primary/40'
            )}
          />
        </div>
      )}
    </motion.div>
  )
}
