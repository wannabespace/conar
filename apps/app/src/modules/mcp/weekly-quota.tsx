import { FREE_WEEKLY_LIMITS } from '@tamery/shared/usage'
import { Button } from '@tamery/ui/components/button'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

import { SettingsGroup, SettingsRow } from '~/core/settings/settings-group'
import { checkOrUpgrade, usePermissions } from '~/core/user/permissions'
import { usageQueryOptions } from '~/core/user/usage'

export const WeeklyQuota = () => {
  const unlimited = usePermissions().check('mcp.unlimited')
  const { data: usage } = useQuery({
    ...usageQueryOptions,
    enabled: !unlimited,
  })

  if (unlimited || !usage?.mcp) {
    return null
  }

  return (
    <SettingsGroup>
      <SettingsRow
        title="Agent queries this week"
        description={`The free plan includes ${FREE_WEEKLY_LIMITS.mcp} a week, counting each query and execute. They come back on ${format(usage.mcp.resetAt, 'EEEE')}; Pro removes the limit.`}
      >
        <span className="text-muted-foreground text-xs tabular-nums">
          {Math.max(0, usage.mcp.max - usage.mcp.used)} left
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
