import { FREE_LIMITS, usageResetsAt } from '@tamery/shared/usage'
import { Button } from '@tamery/ui/components/button'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

import { SettingsGroup, SettingsRow } from '~/core/settings/settings-group'
import { checkOrUpgrade, usePermissions } from '~/core/user/permissions'

import { usedQueryOptions } from './usage'

export const WeeklyQuota = () => {
  const unlimited = usePermissions().check('mcp.unlimited')
  const { data: used } = useQuery({ ...usedQueryOptions, enabled: !unlimited })

  if (unlimited || used === undefined) {
    return null
  }

  return (
    <SettingsGroup>
      <SettingsRow
        title="Agent queries this week"
        description={`The free plan includes ${FREE_LIMITS.mcp.max} a week, counting each query and execute. They come back on ${format(usageResetsAt('mcp'), 'EEEE')}; Pro removes the limit.`}
      >
        <span className="text-muted-foreground text-xs tabular-nums">
          {Math.max(0, FREE_LIMITS.mcp.max - used)} left
        </span>
        <Button
          size="xs"
          variant="outline"
          onClick={() => checkOrUpgrade('mcp.unlimited')}
        >
          Upgrade
        </Button>
      </SettingsRow>
    </SettingsGroup>
  )
}
