import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useQuery } from '@tanstack/react-query'

import { ConnectionIcon } from '~/core/connection/connection-icon'
import { useFetchingConfig } from '~/core/connection/fetching'
import type { Connection } from '~/core/connection/sync'
import { connectionVersionQueryOptions } from '~/core/queries/connection/version'

const VersionTooltipContent = ({
  canSend,
  isVersionPending,
  version,
}: {
  canSend: boolean
  isVersionPending: boolean
  version: string | undefined
}) => {
  if (!canSend) {
    return <span className="opacity-50">Version is unavailable</span>
  }
  if (isVersionPending) {
    return <span className="animate-pulse">Loading version...</span>
  }
  if (version) {
    return <div className="flex items-center gap-1">{version}</div>
  }
  return <span className="opacity-50">Version cannot be detected</span>
}

export const ConnectionIconWithVersion = ({
  connection,
}: {
  connection: Connection
}) => {
  const { canSend } = useFetchingConfig(connection)
  const { data: version, isPending: isVersionPending } = useQuery({
    ...connectionVersionQueryOptions(connection),
    enabled: canSend,
  })

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ConnectionIcon
            type={connection.type}
            className="pointer-events-auto size-5 shrink-0"
          />
        }
      />

      <TooltipContent
        side="left"
        className="pointer-events-auto"
        sideOffset={10}
      >
        <span className="flex items-center gap-1">
          <span className="opacity-50">Version: </span>
          <VersionTooltipContent
            canSend={canSend}
            isVersionPending={isVersionPending}
            version={version}
          />
        </span>
      </TooltipContent>
    </Tooltip>
  )
}
