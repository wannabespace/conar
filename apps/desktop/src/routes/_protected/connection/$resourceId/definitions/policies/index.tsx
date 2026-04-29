import type { policyType } from '~/entities/connection/queries'
import { uppercaseFirst } from '@conar/shared/utils/helpers'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardContent, CardTitle } from '@conar/ui/components/card'
import { CardMotion } from '@conar/ui/components/card.motion'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { SearchInput } from '@conar/ui/components/custom/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { RiEyeLine, RiEyeOffLine, RiShieldCheckLine, RiTable2 } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { resourcePoliciesQuery } from '~/entities/connection/queries'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { DefinitionsEmptyState } from '~/routes/_protected/connection/$resourceId/definitions/-components/empty-state'
import { DefinitionsGrid } from '~/routes/_protected/connection/$resourceId/definitions/-components/grid'
import { DefinitionsHeader } from '~/routes/_protected/connection/$resourceId/definitions/-components/header'
import { MOTION_BLOCK_PROPS } from '~/routes/_protected/connection/$resourceId/definitions/-constants'
import { useDefinitionsState } from '../-hooks/use-definitions-state'

export const Route = createFileRoute('/_protected/connection/$resourceId/definitions/policies/')({
  component: DatabasePoliciesPage,
  loader: ({ context }) => ({ connection: context.connection, connectionResource: context.connectionResource }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title('Policies', loaderData.connection.name) }] : [],
  }),
})

type PolicyType = typeof policyType.infer['type']

function formatType(type: PolicyType) {
  return uppercaseFirst(type.toLowerCase())
}

function getIcon(type: PolicyType) {
  switch (type) {
    case 'PERMISSIVE':
      return <RiEyeLine className="size-4 text-primary" />
    case 'RESTRICTIVE':
      return <RiEyeOffLine className="size-4 text-destructive" />
    default:
      return <RiShieldCheckLine className="size-4 text-primary" />
  }
}

// eslint-disable-next-line react-refresh/only-export-components
function DatabasePoliciesPage() {
  const { connectionResource } = Route.useLoaderData()
  const { data: policies, refetch, isFetching, isPending, dataUpdatedAt } = useQuery(resourcePoliciesQuery({ connectionResource }))
  const { schemas, selectedSchema, setSelectedSchema, search, setSearch } = useDefinitionsState({ connectionResource })
  const [filterType, setFilterType] = useState<PolicyType | 'all'>('all')

  useRefreshHotkey(refetch, isFetching)

  const filteredPolicies = policies?.filter(item =>
    item.schema === selectedSchema
    && (filterType === 'all' || filterType === item.type)
    && (!search
      || item.name.toLowerCase().includes(search.toLowerCase())
      || item.table.toLowerCase().includes(search.toLowerCase())
      || (item.command && item.command.toLowerCase().includes(search.toLowerCase()))
    ),
  ) ?? []

  return (
    <>
      <DefinitionsHeader
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        dataUpdatedAt={dataUpdatedAt}
      >
        Policies
      </DefinitionsHeader>
      <div className="mb-4 flex items-center gap-2">
        <SearchInput
          placeholder="Search policies"
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <Select value={filterType} onValueChange={v => setFilterType(v as PolicyType | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="PERMISSIVE">Permissive</SelectItem>
            <SelectItem value="RESTRICTIVE">Restrictive</SelectItem>
          </SelectContent>
        </Select>
        {schemas.length > 1 && (
          <Select
            value={selectedSchema ?? ''}
            onValueChange={(v) => {
              if (v) {
                setSelectedSchema(v)
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">schema</span>
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {schemas.map(schema => (
                <SelectItem key={schema} value={schema}>{schema}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <DefinitionsGrid loading={isPending}>
        {filteredPolicies.length === 0 && (
          <DefinitionsEmptyState
            title="No policies found"
            description="This schema doesn't have any policies matching your filter."
          />
        )}

        {filteredPolicies.map(item => (
          <CardMotion
            key={`${item.schema}-${item.table}-${item.name}`}
            layout
            {...MOTION_BLOCK_PROPS}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2 flex items-center gap-2 text-base">
                    {getIcon(item.type)}
                    <HighlightText text={item.name} match={search} />
                    <Badge variant="secondary">{formatType(item.type)}</Badge>
                    <Badge variant="secondary">{item.command}</Badge>
                    {!item.enabled && <Badge variant="destructive">Disabled</Badge>}
                  </CardTitle>
                  <div className="
                    flex items-center gap-1.5 text-sm text-muted-foreground
                  "
                  >
                    <Badge variant="outline">
                      <RiTable2 className="size-3" />
                      <HighlightText text={item.table} match={search} />
                    </Badge>
                    {item.roles.length > 0 && (
                      <>
                        <span>to</span>
                        {item.roles.map(role => (
                          <Badge key={role} variant="outline">
                            {role}
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            {(item.using || item.check) && (
              <CardContent className="border-t bg-muted/10 px-4 py-3 text-sm">
                <div className="
                  flex flex-col gap-1.5 text-xs text-muted-foreground
                "
                >
                  {item.using && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-medium text-foreground">USING:</span>
                      <code>{item.using}</code>
                    </div>
                  )}
                  {item.check && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-medium text-foreground">CHECK:</span>
                      <code>{item.check}</code>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </CardMotion>
        ))}
      </DefinitionsGrid>
    </>
  )
}
