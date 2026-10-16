import { SettingsRow } from '@tamery/ui/components/custom/settings-group'
import { Switch } from '@tamery/ui/components/switch'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '~/lib/query-client'

export const ElectronSwitchRow = ({
  description,
  event,
  get,
  id,
  set,
  title,
}: {
  description: string
  event: string
  get: () => Promise<boolean> | undefined
  id: string
  set: (enabled: boolean) => Promise<boolean> | undefined
  title: string
}) => {
  const queryKey = ['electron-switch', id]
  const { data: checked } = useQuery({ queryFn: get, queryKey })
  const { mutate } = useMutation({
    meta: { event },
    mutationFn: async (enabled: boolean) => await set(enabled),
    onError: (error) => toast.error(error.message),
    onSuccess: (next) => queryClient.setQueryData(queryKey, next),
  })

  return (
    <SettingsRow htmlFor={id} title={title} description={description}>
      <Switch
        id={id}
        size="sm"
        checked={!!checked}
        onCheckedChange={(enabled) => mutate(enabled)}
      />
    </SettingsRow>
  )
}
