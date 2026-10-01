import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { setTriggerEnabledQuery } from '~/core/queries/triggers/set-enabled'
import { queryClient } from '~/lib/query-client'

import type { SectionInspectorProps } from '../../components/inspector'
import type { TriggerItem } from './trigger-draft'

interface TriggerToggle {
  enabled: boolean
  item: TriggerItem
}

export const useToggle = ({
  queryKey,
  run,
}: Pick<SectionInspectorProps<TriggerItem>, 'queryKey' | 'run'>) =>
  useMutation({
    mutationFn: ({ enabled, item }: TriggerToggle) =>
      run(
        setTriggerEnabledQuery({
          enabled,
          mode: item.enabledMode,
          name: item.name,
          schema: item.schema,
          table: item.table,
        })
      ),
    onError: (error, { enabled, item }) =>
      toast.error(
        `Failed to ${enabled ? 'enable' : 'disable'} trigger "${item.name}"`,
        { description: error.message }
      ),
    onSuccess: async (_result, { enabled, item }) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(
        `Trigger "${item.name}" ${enabled ? 'enabled' : 'disabled'}`
      )
    },
  })
