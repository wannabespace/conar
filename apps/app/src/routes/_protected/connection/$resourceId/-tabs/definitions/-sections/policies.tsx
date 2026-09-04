import {
  LayoutTable02Icon,
  SecurityCheckIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { uppercaseFirst } from '@tamery/shared/utils/helpers'
import { Badge } from '@tamery/ui/components/badge'
import { CardContent, CardTitle } from '@tamery/ui/components/card'
import { CardMotion } from '@tamery/ui/components/card.motion'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { SearchInput } from '@tamery/ui/components/custom/search-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import type { policyType } from '~/entities/connection/queries'
import { resourcePoliciesQuery } from '~/entities/connection/queries'
import { DefinitionsEmptyState } from '~/routes/_protected/connection/$resourceId/-tabs/definitions/-components/empty-state'
import { DefinitionsGrid } from '~/routes/_protected/connection/$resourceId/-tabs/definitions/-components/grid'
import { DefinitionsHeader } from '~/routes/_protected/connection/$resourceId/-tabs/definitions/-components/header'
import { MOTION_BLOCK_PROPS } from '~/routes/_protected/connection/$resourceId/-tabs/definitions/-constants'

import { useDefinitionsState } from '../-hooks/use-definitions-state'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

type PolicyType = (typeof policyType.infer)['type']

const formatType = (type: PolicyType) => uppercaseFirst(type.toLowerCase())

const getIcon = (type: PolicyType) => {
  switch (type) {
    case 'PERMISSIVE': {
      return (
        <HugeiconsIcon
          icon={ViewIcon}
          strokeWidth={2}
          className="text-primary size-4"
        />
      )
    }
    case 'RESTRICTIVE': {
      return (
        <HugeiconsIcon
          icon={ViewOffSlashIcon}
          strokeWidth={2}
          className="text-destructive size-4"
        />
      )
    }
    default: {
      return (
        <HugeiconsIcon
          icon={SecurityCheckIcon}
          strokeWidth={2}
          className="text-primary size-4"
        />
      )
    }
  }
}

export const Policies = () => {
  const { connectionResource } = useRouteContext()
  const { data: policies, isPending } = useQuery(
    resourcePoliciesQuery({ connectionResource })
  )
  const { schemas, selectedSchema, setSelectedSchema, search, setSearch } =
    useDefinitionsState({
      connectionResource,
    })
  const [filterType, setFilterType] = useState<PolicyType | 'all'>('all')

  const filteredPolicies =
    policies?.filter(
      (item) =>
        item.schema === selectedSchema &&
        (filterType === 'all' || filterType === item.type) &&
        (!search ||
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.table.toLowerCase().includes(search.toLowerCase()) ||
          (item.command &&
            item.command.toLowerCase().includes(search.toLowerCase())))
    ) ?? []

  return (
    <>
      <DefinitionsHeader>Policies</DefinitionsHeader>
      <div className="mb-4 flex items-center gap-2">
        <SearchInput
          placeholder="Search policies"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <Select
          value={filterType}
          onValueChange={(v) => setFilterType(v as PolicyType | 'all')}
        >
          <SelectTrigger className="w-45">
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
            <SelectTrigger className="w-45">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">schema</span>
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {schemas.map((schema) => (
                <SelectItem key={schema} value={schema}>
                  {schema}
                </SelectItem>
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

        {filteredPolicies.map((item) => (
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
                    {!item.enabled && (
                      <Badge variant="destructive">Disabled</Badge>
                    )}
                  </CardTitle>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Badge variant="outline">
                      <HugeiconsIcon
                        icon={LayoutTable02Icon}
                        strokeWidth={2}
                        className="size-3"
                      />
                      <HighlightText text={item.table} match={search} />
                    </Badge>
                    {item.roles.length > 0 && (
                      <>
                        <span>to</span>
                        {item.roles.map((role) => (
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
              <CardContent className="bg-muted/10 border-t px-4 py-3 text-sm">
                <div className="text-muted-foreground flex flex-col gap-1.5 text-xs">
                  {item.using && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-foreground font-medium">
                        USING:
                      </span>
                      <code>{item.using}</code>
                    </div>
                  )}
                  {item.check && (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-foreground font-medium">
                        CHECK:
                      </span>
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
