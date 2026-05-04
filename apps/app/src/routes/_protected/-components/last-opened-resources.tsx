import type { connections, connectionsResources } from '~/drizzle/schema'
import { Button } from '@conar/ui/components/button'
import { RiCloseLine } from '@remixicon/react'
import { eq, inArray, useLiveQuery } from '@tanstack/react-db'
import { Link } from '@tanstack/react-router'
import { useSubscription } from 'seitu/react'
import { ConnectionIcon } from '~/entities/connection/components'
import { useConnectionResourceLinkParams } from '~/entities/connection/hooks'
import { connectionsCollection, connectionsResourcesCollection } from '~/entities/connection/sync'
import { lastOpenedResourcesStorageValue } from '~/entities/connection/utils'

function LastOpenedResource({ connectionResource, connection, onClose }: { connectionResource: typeof connectionsResources.$inferSelect, connection: typeof connections.$inferSelect, onClose: VoidFunction }) {
  const params = useConnectionResourceLinkParams(connectionResource.id)

  return (
    <div className="flex items-center justify-between gap-2">
      <Link
        className="
          flex flex-1 items-center gap-2 py-0.5 text-sm text-foreground
          hover:underline
        "
        preload={false}
        {...params}
      >
        <ConnectionIcon
          type={connection.type}
          className="size-4"
        />
        {connection.name}
        {' '}
        /
        {connectionResource.name}
      </Link>
      <Button
        variant="ghost"
        size="icon-xs"
        className="shrink-0"
        onClick={onClose}
      >
        <RiCloseLine className="text-muted-foreground" />
      </Button>
    </div>
  )
}

export function LastOpenedResources() {
  const lastOpenedResources = useSubscription(lastOpenedResourcesStorageValue)

  const { data } = useLiveQuery(q => q
    .from({ connectionsResources: connectionsResourcesCollection })
    .innerJoin(
      { connections: connectionsCollection },
      ({ connectionsResources, connections }) => eq(connectionsResources.connectionId, connections.id),
    )
    .select(({ connectionsResources, connections }) => ({
      connectionResource: connectionsResources,
      connection: connections,
    }))
    .where(({ connectionsResources }) => inArray(connectionsResources.id, lastOpenedResources)), [lastOpenedResources])
  const toShow = data
    .toSorted((a, b) => lastOpenedResources.indexOf(a.connectionResource.id) - lastOpenedResources.indexOf(b.connectionResource.id))

  const close = (resource: typeof connectionsResources.$inferSelect) => {
    lastOpenedResourcesStorageValue.set(prev => prev.filter(id => id !== resource.id))
  }

  if (toShow.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">Last Opened</h3>
      <div className="flex flex-col gap-1">
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
