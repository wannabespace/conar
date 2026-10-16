import { SettingsRow } from '@tamery/ui/components/custom/settings-group'
import { Switch } from '@tamery/ui/components/switch'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '~/lib/query-client'

const KEEP_RUNNING_KEY = ['mcp', 'keep-running']
const OPEN_AT_LOGIN_KEY = ['mcp', 'open-at-login']

export const BackgroundSettings = () => {
  const { data: keepRunning } = useQuery({
    queryFn: () => window.electron?.keepRunning.get(),
    queryKey: KEEP_RUNNING_KEY,
  })
  const { data: openAtLogin } = useQuery({
    queryFn: () => window.electron?.openAtLogin.get(),
    queryKey: OPEN_AT_LOGIN_KEY,
  })
  const { mutate: setKeepRunning } = useMutation({
    meta: { event: 'mcp_background_toggled' },
    mutationFn: async (enabled: boolean) =>
      await window.electron?.keepRunning.set(enabled),
    onError: (error) => toast.error(error.message),
    onSuccess: (next) => {
      queryClient.setQueryData(KEEP_RUNNING_KEY, next)
      void queryClient.invalidateQueries({ queryKey: OPEN_AT_LOGIN_KEY })
    },
  })
  const { mutate: setOpenAtLogin } = useMutation({
    meta: { event: 'mcp_open_at_login_toggled' },
    mutationFn: async (enabled: boolean) =>
      await window.electron?.openAtLogin.set(enabled),
    onError: (error) => toast.error(error.message),
    onSuccess: (next) => queryClient.setQueryData(OPEN_AT_LOGIN_KEY, next),
  })

  if (keepRunning === undefined) {
    return null
  }

  return (
    <>
      <SettingsRow
        htmlFor="mcp-keep-running"
        title="Keep running in the background"
        description="Closing the window keeps Tamery and the server running, so agents keep working until you quit."
      >
        <Switch
          id="mcp-keep-running"
          size="sm"
          checked={keepRunning}
          onCheckedChange={(enabled) => setKeepRunning(enabled)}
        />
      </SettingsRow>
      {keepRunning && typeof openAtLogin === 'boolean' && (
        <SettingsRow
          htmlFor="mcp-open-at-login"
          title="Start at login"
          description="Opens Tamery without a window when you log in, so agents can connect before you open it."
        >
          <Switch
            id="mcp-open-at-login"
            size="sm"
            checked={openAtLogin}
            onCheckedChange={(enabled) => setOpenAtLogin(enabled)}
          />
        </SettingsRow>
      )}
    </>
  )
}
