import { Switch } from '@tamery/ui/components/switch'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { SettingsGroup, SettingsRow } from '~/core/settings/settings-group'
import { queryClient } from '~/lib/query-client'

const QUERY_KEY = ['connection-links', 'is-default']

export const ConnectionLinksSettings = () => {
  const { data: isDefault } = useQuery({
    queryFn: async () =>
      (await window.electron?.connectionLinks.isDefault()) ?? false,
    queryKey: QUERY_KEY,
  })
  const { mutate: setDefault } = useMutation({
    meta: { event: 'connection_links_default_toggled' },
    mutationFn: async (enabled: boolean) =>
      (await window.electron?.connectionLinks.setDefault(enabled)) ?? false,
    onError: (error) => toast.error(error.message),
    onSuccess: (next) => queryClient.setQueryData(QUERY_KEY, next),
  })

  return (
    <SettingsGroup title="Links">
      <SettingsRow
        htmlFor="connection-links-default"
        title="Open database links in Tamery"
        description="postgres://, mysql://, sqlserver:// and clickhouse:// links open the matching connection, or a new one filled in from the link."
      >
        <Switch
          id="connection-links-default"
          size="sm"
          checked={!!isDefault}
          onCheckedChange={(enabled) => setDefault(enabled)}
        />
      </SettingsRow>
    </SettingsGroup>
  )
}
