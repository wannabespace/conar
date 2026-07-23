import {
  RiFileListLine,
  RiGlobalLine,
  RiNodeTree,
  RiPlayLargeLine,
  RiShieldCheckLine,
  RiTableLine,
} from '@remixicon/react'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { Button } from '@tamery/ui/components/button'
import { ScrollArea } from '@tamery/ui/components/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { eq, useLiveQuery } from '@tanstack/react-db'
import type { LinkProps } from '@tanstack/react-router'
import { Link, useLocation, useMatches, useSearch } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { useSubscription } from 'seitu/react'

import { useCollections } from '~/entities/collections'
import { getConnectionResourceStore } from '~/entities/connection/store'

import { Route } from '../$resourceId'

function baseClasses(isActive = false) {
  return cn(
    `
      flex size-9 items-center justify-center rounded-md border
      border-transparent text-foreground
    `,
    isActive &&
      `
      border-primary/20 bg-primary/10 text-primary
      hover:bg-primary/20
    `,
  )
}

function MainLinks() {
  const { connectionResource } = Route.useRouteContext()
  const { schema: schemaParam, table: tableParam } = useSearch({ strict: false })
  const match = useMatches({
    select: matches => matches.map(match => match.routeId).at(-1),
  })
  const store = getConnectionResourceStore(connectionResource.id)
  const lastOpenedTable = useSubscription(store, { selector: state => state.lastOpenedTable })

  useEffect(() => {
    if (
      tableParam &&
      schemaParam &&
      tableParam !== lastOpenedTable?.table &&
      schemaParam !== lastOpenedTable?.schema
    ) {
      store.set(
        state =>
          ({
            ...state,
            lastOpenedTable: { schema: schemaParam, table: tableParam },
          }) satisfies typeof state,
      )
    }
  }, [store, lastOpenedTable, tableParam, schemaParam])

  const isActiveSql = match === '/_protected/connection/$resourceId/query/'
  const isActiveTables = match === '/_protected/connection/$resourceId/table/'
  const isActiveDefinitions = match?.includes('/_protected/connection/$resourceId/definitions')
  const isActiveVisualizer = match === '/_protected/connection/$resourceId/visualizer/'

  const isCurrentTableAsLastOpened =
    lastOpenedTable?.schema === schemaParam && lastOpenedTable?.table === tableParam

  const route = useMemo(() => {
    if (!isCurrentTableAsLastOpened && lastOpenedTable) {
      return {
        to: '/connection/$resourceId/table',
        params: { resourceId: connectionResource.id },
        search: { schema: lastOpenedTable.schema, table: lastOpenedTable.table },
      } satisfies LinkProps
    }

    return {
      to: '/connection/$resourceId/table',
      params: { resourceId: connectionResource.id },
    } satisfies LinkProps
  }, [connectionResource.id, isCurrentTableAsLastOpened, lastOpenedTable])

  function onTablesClick() {
    if (isCurrentTableAsLastOpened && lastOpenedTable) {
      store.set(
        state =>
          ({
            ...state,
            lastOpenedTable: null,
          }) satisfies typeof state,
      )
    }
  }

  const lastOpenedChatId = useSubscription(store, { selector: state => state.lastOpenedChatId })

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              to="/connection/$resourceId/query"
              params={{ resourceId: connectionResource.id }}
              search={lastOpenedChatId ? { chatId: lastOpenedChatId } : {}}
              className={baseClasses(isActiveSql)}
            />
          }
        >
          <RiPlayLargeLine className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="right">SQL Runner</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              className={baseClasses(isActiveTables)}
              {...route}
              onClick={() => {
                onTablesClick()
              }}
            />
          }
        >
          <RiTableLine className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="right">Tables</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              to="/connection/$resourceId/definitions"
              params={{ resourceId: connectionResource.id }}
              className={baseClasses(isActiveDefinitions)}
            />
          }
        >
          <RiShieldCheckLine className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="right">Definitions</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              to="/connection/$resourceId/visualizer"
              params={{ resourceId: connectionResource.id }}
              className={baseClasses(isActiveVisualizer)}
            />
          }
        >
          <RiNodeTree className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="right">Visualizer</TooltipContent>
      </Tooltip>
    </>
  )
}

export function ConnectionSidebar({ className, ...props }: React.ComponentProps<'div'>) {
  const { connection, connectionResource } = Route.useRouteContext()
  const { connectionStringsCollection } = useCollections()
  const { data: connectionString } = useLiveQuery(
    q =>
      q
        .from({ cs: connectionStringsCollection })
        .where(({ cs }) => eq(cs.connectionId, connection.id))
        .findOne(),
    [connectionStringsCollection, connection.id],
  )
  const store = getConnectionResourceStore(connectionResource.id)
  const location = useLocation()

  const canOpenWeb = window.electron
    ? connection.syncType === SyncType.Cloud && !connectionString?.isLocalhost
    : false

  return (
    <div className={cn('flex flex-col items-center', className)} {...props}>
      <ScrollArea className="relative flex flex-1 flex-col items-center gap-2">
        <div className="w-full p-4">
          <div className="flex w-full flex-col">
            <MainLinks />
          </div>
        </div>
      </ScrollArea>
      <div className="flex flex-col items-center p-4 pt-0">
        {canOpenWeb && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => window.open(import.meta.env.VITE_PUBLIC_WEB_URL + location.href)}
                />
              }
            >
              <RiGlobalLine className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="right">Open this connection in the web app</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  store.set(
                    state =>
                      ({ ...state, loggerOpened: !state.loggerOpened }) satisfies typeof state,
                  )
                }
              />
            }
          >
            <RiFileListLine className="size-4" />
          </TooltipTrigger>
          <TooltipContent side="right">Query Logger</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
