import type { policyType } from '~/entities/connection/sql/policies'
import { uppercaseFirst } from '@conar/shared/utils/helpers'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardContent, CardHeader, CardTitle, MotionCard } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { SearchInput } from '@conar/ui/components/custom/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { RiEyeLine, RiEyeOffLine, RiShieldCheckLine, RiTable2 } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useConnectionPolicies, useConnectionTablesAndSchemas } from '~/entities/connection/queries'
import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
import { MOTION_BLOCK_PROPS } from '../-constants'

export const Route = createFileRoute('/_protected/database/$id/definitions/policies/')({
  component: DatabasePoliciesPage,
  loader: ({ context }) => ({ connection: context.connection }),
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

function DatabasePoliciesPage() {
  const { connection } = Route.useLoaderData()
  const { data: policies, refetch, isFetching, isPending, dataUpdatedAt } = useConnectionPolicies({ connection })
  const { data } = useConnectionTablesAndSchemas({ connection })
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<PolicyType | 'all'>('all')

  if (schemas.length > 0 && (!selectedSchema || !schemas.includes(selectedSchema)))
    setSelectedSchema(schemas[0])

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
          <Select value={selectedSchema ?? ''} onValueChange={setSelectedSchema}>
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
          <MotionCard
            key={`${item.schema}-${item.table}-${item.name}`}
            layout
            {...MOTION_BLOCK_PROPS}
          >
            <CardHeader className="bg-muted/30 px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {getIcon(item.type)}
                    <HighlightText text={item.name} match={search} />
                    <Badge
                      variant={item.type === 'PERMISSIVE' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {formatType(item.type)}
                    </Badge>
                    {item.command && (
                      <Badge variant="outline" className="text-xs">
                        {item.command}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className={`
                    mt-2 flex items-center gap-2 text-sm text-muted-foreground
                  `}
                  >
                    <Badge variant="outline" className="text-xs">
                      <RiTable2 className="mr-1 size-3" />
                      <HighlightText text={item.table} match={search} />
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            {(item.using || item.check || (item.roles && item.roles.length > 0)) && (
              <CardContent className="border-t bg-muted/10 px-4 py-3 text-sm space-y-2">
                {item.roles && item.roles.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-semibold">Roles:</span>
                    <div className="flex gap-1 flex-wrap">
                      {item.roles.map(role => (
                        <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {item.using && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground font-semibold">Using:</span>
                    <code className="rounded-sm bg-muted px-2 py-1 font-mono text-xs">{item.using}</code>
                  </div>
                )}
                {item.check && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground font-semibold">With Check:</span>
                    <code className="rounded-sm bg-muted px-2 py-1 font-mono text-xs">{item.check}</code>
                  </div>
                )}
              </CardContent>
            )}
          </MotionCard>
        ))}
      </DefinitionsGrid>
    </>
  )
}
