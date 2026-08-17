import { RiGlobalLine } from '@remixicon/react'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { Button } from '@tamery/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { getRouteApi, useLocation } from '@tanstack/react-router'

import { useCollections } from '~/entities/collections'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const NavigatorMenu = () => {
  const { connection } = useRouteContext()
  const { connectionStringsCollection } = useCollections()
  const location = useLocation()

  const { data: connectionString } = useLiveQuery(
    (q) =>
      q
        .from({ cs: connectionStringsCollection })
        .where(({ cs }) => eq(cs.connectionId, connection.id))
        .findOne(),
    [connectionStringsCollection, connection.id]
  )

  const canOpenWeb = window.electron
    ? connection.syncType === SyncType.Cloud && !connectionString?.isLocalhost
    : false

  if (!canOpenWeb) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open in web app"
            className="text-muted-foreground"
            onClick={() =>
              window.open(import.meta.env.VITE_PUBLIC_WEB_URL + location.href)
            }
          />
        }
      >
        <RiGlobalLine />
      </TooltipTrigger>
      <TooltipContent side="bottom">Open in web app</TooltipContent>
    </Tooltip>
  )
}
