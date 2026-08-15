import { RiCloseLine } from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useSubscription } from 'seitu/react'

import { Link } from '~/components/link'
import { useCollections } from '~/entities/collections'
import { ConnectionIcon } from '~/entities/connection/components'
import type { Connection, ConnectionResource } from '~/entities/connection/core'
import { useConnectionResourceLinkParams } from '~/entities/connection/hooks'
import { lastOpenedResourcesStorageValue } from '~/entities/connection/utils'
import { useConnectionWorkspaceFilter } from '~/entities/workspace'

const LastOpenedResource = ({
  connectionResource,
  connection,
  onClose,
}: {
  connectionResource: ConnectionResource
  connection: Connection
  onClose: VoidFunction
}) => {
  const params = useConnectionResourceLinkParams(connectionResource.id)

  return (
    <div className="group hover:bg-accent/50 flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm">
      <Link
        className="text-foreground hover:text-foreground flex min-w-0 flex-1 cursor-default items-center gap-2.5"
        preload={false}
        {...params}
      >
        <ConnectionIcon type={connection.type} className="size-4 shrink-0" />
        <span data-mask className="truncate">
          {connection.name}
          <span className="text-muted-foreground">
            {' '}
            / {connectionResource.name}
          </span>
        </span>
      </Link>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Remove from recents"
              className="text-muted-foreground hover:bg-foreground/10 hover:text-foreground shrink-0 opacity-0 transition-opacity duration-100 group-hover:opacity-100 focus-visible:opacity-100"
              onClick={onClose}
            />
          }
        >
          <RiCloseLine />
        </TooltipTrigger>
        <TooltipContent side="top">Remove from recents</TooltipContent>
      </Tooltip>
    </div>
  )
}

const close = (resource: ConnectionResource) => {
  lastOpenedResourcesStorageValue.set((prev) =>
    prev.filter((id) => id !== resource.id)
  )
}

export const LastOpenedResources = () => {
  const { connectionsCollection, connectionsResourcesCollection } =
    useCollections()
  const lastOpenedResources = useSubscription(lastOpenedResourcesStorageValue)
  const inActiveWorkspace = useConnectionWorkspaceFilter()

  const { data } = useLiveQuery(
    (q) =>
      q
        .from({ connectionsResources: connectionsResourcesCollection })
        .innerJoin(
          { connections: connectionsCollection },
          ({ connectionsResources, connections }) =>
            eq(connectionsResources.connectionId, connections.id)
        )
        .select(({ connectionsResources, connections }) => ({
          connectionResource: connectionsResources,
          connection: connections,
        })),
    [connectionsResourcesCollection, connectionsCollection]
  )
  const toShow = data
    .filter(
      ({ connectionResource, connection }) =>
        lastOpenedResources.includes(connectionResource.id) &&
        inActiveWorkspace(connection.workspaceId)
    )
    .toSorted(
      (a, b) =>
        lastOpenedResources.indexOf(a.connectionResource.id) -
        lastOpenedResources.indexOf(b.connectionResource.id)
    )

  if (toShow.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="text-2xs text-muted-foreground mb-1.5 px-2 font-semibold tracking-wider uppercase">
        Last Opened
      </h3>
      <div className="flex flex-col gap-0.5">
        {toShow.map(({ connectionResource, connection }) => (
          <LastOpenedResource
            key={connectionResource.id}
            connectionResource={connectionResource}
            connection={connection}
            onClose={() => close(connectionResource)}
          />
        ))}
      </div>
    </div>
  )
}
