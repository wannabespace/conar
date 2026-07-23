import { RiDatabase2Line, RiSearchLine } from '@remixicon/react'
import { CONNECTION_TYPES_WITHOUT_SYSTEM_TABLES } from '@tamery/shared/constants'
import { Button } from '@tamery/ui/components/button'
import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@tamery/ui/components/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'

import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries'
import { getConnectionResourceStore } from '~/entities/connection/store'

import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_FOLD_TRANSITION,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  tablesSidebarOpenValue,
  tablesSidebarWidthValue,
} from './constants'
import { TablesList } from './tables-list'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const resizeOverlay = document.createElement('div')
resizeOverlay.className = 'cursor-col-resize size-full fixed top-0 left-0 z-1000'

export function TablesSidebar() {
  const { connection, connectionResource } = useRouteContext()
  const isOpen = useSubscription(tablesSidebarOpenValue)
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, { selector: state => state.showSystem })
  const search = useSubscription(store, { selector: state => state.tablesSearch })
  const {
    refetch: refetchTablesAndSchemas,
    isFetching: isRefreshingTablesAndSchemas,
    dataUpdatedAt,
  } = useQuery(resourceTablesAndSchemasQueryOptions({ connectionResource, showSystem }))

  const canToggleSystem = !CONNECTION_TYPES_WITHOUT_SYSTEM_TABLES.includes(connection.type)

  const width = useSubscription(tablesSidebarWidthValue)
  const [isResizing, setIsResizing] = useState(false)

  const handleResize = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsResizing(true)
    const startX = e.clientX
    const startWidth = tablesSidebarWidthValue.get()

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeOverlay.parentElement) {
        document.body.appendChild(resizeOverlay)
      }
      tablesSidebarWidthValue.set(
        Math.min(
          SIDEBAR_MAX_WIDTH,
          Math.max(SIDEBAR_MIN_WIDTH, startWidth + moveEvent.clientX - startX),
        ),
      )
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      setIsResizing(false)
      if (resizeOverlay.parentElement) {
        document.body.removeChild(resizeOverlay)
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
      transition={isResizing ? { duration: 0 } : SIDEBAR_FOLD_TRANSITION}
      className="relative h-full shrink-0 overflow-hidden"
    >
      <div className="flex h-full flex-col pr-2 text-foreground" style={{ width }}>
        <div className="flex shrink-0 items-center gap-1 p-2 pb-1.5">
          <InputGroup className="h-7 flex-1 rounded-md bg-input/60">
            <InputGroupAddon>
              <RiSearchLine className="size-3.5 text-muted-foreground/70" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search"
              className="text-sm"
              value={search}
              onChange={e =>
                store.set(
                  state => ({ ...state, tablesSearch: e.target.value }) satisfies typeof state,
                )
              }
            />
          </InputGroup>
          {canToggleSystem && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-pressed={showSystem}
                    className={cn('text-muted-foreground', showSystem && 'bg-accent text-primary')}
                    onClick={() =>
                      store.set(
                        state => ({ ...state, showSystem: !showSystem }) satisfies typeof state,
                      )
                    }
                  />
                }
              >
                <RiDatabase2Line className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {showSystem ? 'Hide system tables' : 'Show system tables'}
              </TooltipContent>
            </Tooltip>
          )}
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
                  {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'never'}
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <TablesList className="min-h-0 flex-1" search={search} />
      </div>
      {isOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          tabIndex={0}
          className="group absolute inset-y-0 right-0 z-10 cursor-col-resize px-2 duration-150 select-none"
          onMouseDown={handleResize}
          onDoubleClick={() => tablesSidebarWidthValue.set(SIDEBAR_DEFAULT_WIDTH)}
        >
          <div
            className={cn(
              'h-full w-1 rounded-xs transition-colors group-hover:bg-border',
              isResizing && 'bg-primary/40',
            )}
          />
        </div>
      )}
    </motion.div>
  )
}
