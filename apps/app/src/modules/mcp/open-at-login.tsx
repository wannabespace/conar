import { SettingsRow } from '@tamery/ui/components/custom/settings-group'
import { Switch } from '@tamery/ui/components/switch'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '~/lib/query-client'

const QUERY_KEY = ['mcp', 'open-at-login']

export const OpenAtLoginRow = () => {
  const { data: openAtLogin } = useQuery({
    queryFn: () => window.electron?.openAtLogin.get(),
    queryKey: QUERY_KEY,
  })
  const { mutate: setOpenAtLogin } = useMutation({
    meta: { event: 'mcp_open_at_login_toggled' },
    mutationFn: async (enabled: boolean) =>
      await window.electron?.openAtLogin.set(enabled),
    onError: (error) => toast.error(error.message),
    onSuccess: (next) => queryClient.setQueryData(QUERY_KEY, next),
  })

  if (openAtLogin === null || openAtLogin === undefined) {
    return null
  }

  return (
    <SettingsRow
      htmlFor="mcp-open-at-login"
      title="Open at login"
      description="Starts Tamery in the background when you log in, so agents can connect before you open it. Closing the window keeps the server running until you quit."
    >
      <Switch
        id="mcp-open-at-login"
        size="sm"
        checked={openAtLogin}
        onCheckedChange={(enabled) => setOpenAtLogin(enabled)}
      />
    </SettingsRow>
  )
}
