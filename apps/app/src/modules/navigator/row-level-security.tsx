import {
  SecurityBlockIcon,
  SecurityCheckIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { toast } from 'sonner'

import type { AppMenuNode } from '~/components/app-menu'
import { resourcePoliciesQueryOptions } from '~/core/queries/policies/list'
import { setRowLevelSecurityQuery } from '~/core/queries/policies/set-row-level-security'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import { queryClient } from '~/lib/query-client'

import type { TreeRow } from './tree-row'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const useRowLevelSecurityItems = ({
  schema,
  table,
}: Extract<TreeRow, { kind: 'table' }>): AppMenuNode[] => {
  const { connectionResource } = useRouteContext()
  const mutation = useMutation({
    meta: { event: 'row_level_security_toggled' },
    mutationFn: async (enabled: boolean) =>
      setRowLevelSecurityQuery({
        enabled,
        name: table.name,
        schema,
        table: table.name,
      }).run(await connectionResourceToQueryParams(connectionResource)),
    onError: (error, enabled) =>
      toast.error(
        `Failed to ${enabled ? 'enable' : 'disable'} row level security on "${table.name}"`,
        { description: error.message }
      ),
    onSuccess: async (_result, enabled) => {
      await Promise.all([
        queryClient.invalidateQueries(
          resourceTablesAndSchemasQueryOptions({ connectionResource })
        ),
        queryClient.invalidateQueries(
          resourcePoliciesQueryOptions({ connectionResource })
        ),
      ])
      toast.success(
        `Row level security ${enabled ? 'enabled' : 'disabled'} on "${table.name}"`
      )
    },
  })

  if (table.type !== 'table' || table.rowLevelSecurity === undefined) {
    return []
  }

  return [
    {
      disabled: mutation.isPending,
      icon: table.rowLevelSecurity ? SecurityBlockIcon : SecurityCheckIcon,
      label: table.rowLevelSecurity ? 'Disable RLS' : 'Enable RLS',
      onSelect: () => mutation.mutate(!table.rowLevelSecurity),
    },
  ]
}

export const RowLevelSecurityMark = ({ active }: { active: boolean }) => (
  <Tooltip>
    <TooltipTrigger render={<span className="shrink-0" />}>
      <HugeiconsIcon
        icon={SecurityCheckIcon}
        strokeWidth={2}
        className={cn(
          'size-3!',
          active ? 'text-primary-foreground/70!' : 'text-muted-foreground'
        )}
      />
    </TooltipTrigger>
    <TooltipContent>Row level security enabled</TooltipContent>
  </Tooltip>
)
