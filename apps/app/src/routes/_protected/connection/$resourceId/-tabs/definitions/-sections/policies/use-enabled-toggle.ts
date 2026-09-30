import { uppercaseFirst } from '@tamery/shared/utils'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { setRowLevelSecurityQuery } from '~/entities/connection/queries/policies/set-row-level-security'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'
import { queryClient } from '~/lib/query-client'

import type { SectionInspectorProps } from '../../-components/inspector'
import type { PolicyItem } from './policy-draft'

export const useEnabledToggle = ({
  connectionResource,
  item,
  queryKey,
  run,
  subject,
}: Pick<
  SectionInspectorProps<PolicyItem>,
  'connectionResource' | 'item' | 'queryKey' | 'run'
> & {
  subject: string
}) =>
  useMutation({
    mutationFn: ({ enabled }: { enabled: boolean }) =>
      run(
        setRowLevelSecurityQuery({
          enabled,
          name: item?.name ?? '',
          schema: item?.schema ?? '',
          table: item?.table ?? '',
        })
      ),
    onError: (error, { enabled }) =>
      toast.error(`Failed to ${enabled ? 'enable' : 'disable'} ${subject}`, {
        description: error.message,
      }),
    onSuccess: async (_result, { enabled }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries(
          resourceTablesAndSchemasQueryOptions({ connectionResource })
        ),
      ])
      toast.success(
        `${uppercaseFirst(subject)} ${enabled ? 'enabled' : 'disabled'}`
      )
    },
  })
