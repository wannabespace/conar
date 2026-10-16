import { Delete02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useMutation, useQuery } from '@tanstack/react-query'
import { formatDistanceStrict } from 'date-fns'
import { toast } from 'sonner'

import { queryClient } from '~/lib/query-client'

import { clientLabel } from './clients'
import { mcpClientsQuery } from './use-mcp-server'

export const ConnectedClients = () => {
  const { data: clients, dataUpdatedAt } = useQuery(mcpClientsQuery)
  const { mutate: forget } = useMutation({
    meta: { event: 'mcp_client_removed' },
    mutationFn: async (name: string) =>
      await window.electron?.mcp.forgetClient(name),
    onError: (error) => toast.error(error.message),
    onSuccess: (next) =>
      queryClient.setQueryData(mcpClientsQuery.queryKey, next),
  })

  if (!clients?.length) {
    return null
  }

  return (
    <SettingsGroup title="Connected clients">
      {clients.map((client) => (
        <SettingsRow
          key={client.name}
          title={clientLabel(client.name)}
          description={`Version ${client.version}`}
        >
          <span className="text-muted-foreground text-xs tabular-nums">
            active{' '}
            {formatDistanceStrict(client.lastSeenAt, dataUpdatedAt, {
              addSuffix: true,
            })}
          </span>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost-destructive"
                  aria-label="Remove"
                  onClick={() => forget(client.name)}
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                </Button>
              }
            />
            <TooltipContent>
              Remove. It shows up again the next time it connects.
            </TooltipContent>
          </Tooltip>
        </SettingsRow>
      ))}
    </SettingsGroup>
  )
}
