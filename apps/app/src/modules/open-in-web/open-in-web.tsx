import { Globe02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useLocation, useParams } from '@tanstack/react-router'

import { useCollections } from '~/core/collections'

const OpenInWebButton = ({ resourceId }: { resourceId: string }) => {
  const {
    connectionsCollection,
    connectionsResourcesCollection,
    connectionStringsCollection,
  } = useCollections()
  const location = useLocation()

  const { data: connection } = useLiveQuery({
    query: (q) =>
      q
        .from({ r: connectionsResourcesCollection })
        .where(({ r }) => eq(r.id, resourceId))
        .innerJoin({ c: connectionsCollection }, ({ r, c }) =>
          eq(c.id, r.connectionId)
        )
        .select(({ c }) => ({ id: c.id, syncType: c.syncType }))
        .findOne(),
  })

  const { data: connectionString } = useLiveQuery({
    query: (q) =>
      q
        .from({ cs: connectionStringsCollection })
        .where(({ cs }) => eq(cs.connectionId, connection?.id ?? ''))
        .findOne(),
  })

  if (
    connection?.syncType !== SyncType.Cloud ||
    connectionString?.isLocalhost
  ) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Open in web app"
            onClick={() =>
              window.open(import.meta.env.VITE_PUBLIC_WEB_URL + location.href)
            }
          />
        }
      >
        <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="bottom">Open in web app</TooltipContent>
    </Tooltip>
  )
}

export const OpenInWeb = () => {
  const { resourceId } = useParams({ strict: false })

  return window.electron && resourceId ? (
    <OpenInWebButton resourceId={resourceId} />
  ) : null
}
