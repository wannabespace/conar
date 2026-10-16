import { SettingsRow } from '@tamery/ui/components/custom/settings-group'
import { Switch } from '@tamery/ui/components/switch'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '~/lib/query-client'

const QUERY_KEY = ['open-at-login']

export const StartAtLoginRow = () => {
  const { data: openAtLogin } = useQuery({
    queryFn: () => window.electron?.openAtLogin.get(),
    queryKey: QUERY_KEY,
  })
  const { mutate: setOpenAtLogin } = useMutation({
    meta: { event: 'open_at_login_toggled' },
    mutationFn: async (enabled: boolean) =>
      await window.electron?.openAtLogin.set(enabled),
    onError: (error) => toast.error(error.message),
    onSuccess: (next) => queryClient.setQueryData(QUERY_KEY, next),
  })

  if (typeof openAtLogin !== 'boolean') {
    return null
  }

  return (
    <SettingsRow
      htmlFor="open-at-login"
      title="Start at login"
      description="Opens Tamery when you log in to this computer."
    >
      <Switch
        id="open-at-login"
        size="sm"
        checked={openAtLogin}
        onCheckedChange={(enabled) => setOpenAtLogin(enabled)}
      />
    </SettingsRow>
  )
}
