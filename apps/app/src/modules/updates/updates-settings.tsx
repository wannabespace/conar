import type { UpdateChannel } from '@tamery/shared/updates'
import { Switch } from '@tamery/ui/components/switch'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { SettingsGroup, SettingsRow } from '~/core/settings/settings-group'
import { queryClient } from '~/lib/query-client'

const UPDATE_CHANNEL_KEY = ['updates', 'channel']

export const UpdatesSettings = () => {
  const { data: channel } = useQuery({
    queryFn: () => window.electron?.app.updateChannel(),
    queryKey: UPDATE_CHANNEL_KEY,
  })
  const { mutate: setChannel } = useMutation({
    meta: { event: 'update_channel_changed' },
    mutationFn: async (next: UpdateChannel) => {
      await window.electron?.app.setUpdateChannel(next)
      return next
    },
    onError: (error) => toast.error(error.message),
    onSuccess: (next) => queryClient.setQueryData(UPDATE_CHANNEL_KEY, next),
  })

  if (!channel) {
    return null
  }

  return (
    <SettingsGroup title="Updates">
      <SettingsRow
        htmlFor="beta-updates"
        title="Beta updates"
        description="Get new features before everyone else. Beta builds can have rough edges. Turning this off moves you back to the latest stable version."
      >
        <Switch
          id="beta-updates"
          size="sm"
          checked={channel === 'beta'}
          onCheckedChange={(isBeta) => setChannel(isBeta ? 'beta' : 'stable')}
        />
      </SettingsRow>
    </SettingsGroup>
  )
}
